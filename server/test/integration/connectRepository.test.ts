import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoConnectRepository from "../../src/domain/connect/connect.repository.mongo.ts";
import { ConnectStateModel } from "../../src/domain/connect/connect.model.ts";
import { CONNECT_STATE_COLLECTION, type ConnectEnrollment } from "../../src/domain/connect/connect.type.ts";
import type { ConnectBackupResult, ConnectOperationRequest } from "../../src/domain/connect/connect-backup.type.ts";

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await ConnectStateModel.init();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await ConnectStateModel.deleteMany({});
});

const enrollment = (overrides: Partial<ConnectEnrollment> = {}): ConnectEnrollment => ({
	connectUrl: "wss://relay.checkmate.so/api/tunnel",
	agentId: "agent-1",
	token: "v1.encrypted-token",
	apiUrl: "https://connect.checkmate.so",
	...overrides,
});

const emptyBackupState = { recoveryKey: null, operation: null, progress: null, lastBackup: null };

describe("MongoConnectRepository", () => {
	const repo = new MongoConnectRepository();

	describe("get", () => {
		it("returns the empty state when nothing has been stored", async () => {
			await expect(repo.get()).resolves.toEqual({ enrollment: null, remoteAccessEnabled: false, ...emptyBackupState });
		});

		it("returns only the state fields", async () => {
			await repo.setEnrollment(enrollment());

			await expect(repo.get()).resolves.toEqual({ enrollment: enrollment(), remoteAccessEnabled: false, ...emptyBackupState });
		});

		it("reads a stored enrollment without an API URL as null", async () => {
			await mongoose.connection.collection(CONNECT_STATE_COLLECTION).insertOne({
				singleton: true,
				enrollment: { connectUrl: "wss://relay.checkmate.so/api/tunnel", agentId: "agent-1", token: "v1.encrypted-token" },
			});

			const state = await repo.get();

			expect(state.enrollment?.apiUrl).toBeNull();
		});
	});

	describe("setEnrollment", () => {
		it("stores in the connect_state collection", async () => {
			await repo.setEnrollment(enrollment());

			const docs = await mongoose.connection.collection(CONNECT_STATE_COLLECTION).find({}).toArray();
			expect(docs).toHaveLength(1);
		});

		it("keeps a single document across repeated enrollments", async () => {
			await repo.setEnrollment(enrollment());
			await repo.setEnrollment(enrollment({ agentId: "agent-2" }));

			expect(await ConnectStateModel.countDocuments({})).toBe(1);
			expect((await repo.get()).enrollment?.agentId).toBe("agent-2");
		});

		it("keeps a single document when first enrollments race", async () => {
			const results = await Promise.allSettled(Array.from({ length: 5 }, (_, i) => repo.setEnrollment(enrollment({ agentId: `agent-${i}` }))));

			expect(results.every((result) => result.status === "fulfilled")).toBe(true);
			expect(await ConnectStateModel.countDocuments({})).toBe(1);
		});

		it("rejects an enrollment missing a required field", async () => {
			await expect(repo.setEnrollment({ ...enrollment(), token: undefined as unknown as string })).rejects.toThrow();
		});
	});

	describe("setSecrets", () => {
		it("replaces only the token", async () => {
			await repo.setEnrollment(enrollment());

			await repo.setSecrets({ token: "v1.reencrypted-token" });

			await expect(repo.get()).resolves.toEqual({
				enrollment: enrollment({ token: "v1.reencrypted-token" }),
				remoteAccessEnabled: false,
				...emptyBackupState,
			});
		});

		it("does nothing when not enrolled", async () => {
			await repo.setEnrollment(enrollment());
			await repo.clearEnrollment();

			await expect(repo.setSecrets({ token: "v1.reencrypted-token" })).resolves.toBeUndefined();
			await expect(repo.get()).resolves.toEqual({ enrollment: null, remoteAccessEnabled: false, ...emptyBackupState });
		});

		it("does nothing when no document exists", async () => {
			await repo.setSecrets({ token: "v1.reencrypted-token" });

			expect(await ConnectStateModel.countDocuments({})).toBe(0);
		});

		it("does nothing when no token is given", async () => {
			await repo.setEnrollment(enrollment());

			await repo.setSecrets({});

			expect((await repo.get()).enrollment?.token).toBe("v1.encrypted-token");
		});
	});

	describe("setRemoteAccess", () => {
		it("persists the flag and leaves the enrollment alone", async () => {
			await repo.setEnrollment(enrollment());

			await repo.setRemoteAccess(true);
			await expect(repo.get()).resolves.toEqual({ enrollment: enrollment(), remoteAccessEnabled: true, ...emptyBackupState });

			await repo.setRemoteAccess(false);
			await expect(repo.get()).resolves.toEqual({ enrollment: enrollment(), remoteAccessEnabled: false, ...emptyBackupState });
		});

		it("does not create a document when nothing is stored", async () => {
			await repo.setRemoteAccess(true);

			expect(await ConnectStateModel.countDocuments({})).toBe(0);
			expect((await repo.get()).remoteAccessEnabled).toBe(false);
		});

		it("reads a document stored before the field existed as off", async () => {
			await mongoose.connection.collection(CONNECT_STATE_COLLECTION).insertOne({ singleton: true, enrollment: null });

			expect((await repo.get()).remoteAccessEnabled).toBe(false);
		});
	});

	describe("clearEnrollment", () => {
		it("turns remote access off", async () => {
			await repo.setEnrollment(enrollment());
			await repo.setRemoteAccess(true);

			await repo.clearEnrollment();

			expect((await repo.get()).remoteAccessEnabled).toBe(false);
		});

		it("clears the enrollment and keeps the document", async () => {
			await repo.setEnrollment(enrollment());

			await repo.clearEnrollment();

			await expect(repo.get()).resolves.toEqual({ enrollment: null, remoteAccessEnabled: false, ...emptyBackupState });
			expect(await ConnectStateModel.countDocuments({})).toBe(1);
		});

		it("does not create a document when never enrolled", async () => {
			await repo.clearEnrollment();

			expect(await ConnectStateModel.countDocuments({})).toBe(0);
		});
	});

	const operation = (): ConnectOperationRequest => ({
		type: "backup",
		kind: "full",
		requestedAt: new Date("2026-11-11T10:00:00.000Z"),
		startedAt: null,
	});

	const result = (overrides: Partial<ConnectBackupResult> = {}): ConnectBackupResult => ({
		ok: true,
		at: new Date("2026-11-11T10:05:00.000Z"),
		kind: "full",
		sizeBytes: 1024,
		sha256: "ab".repeat(32),
		backupId: "11111111-1111-1111-1111-111111111111",
		durationMs: 300,
		error: null,
		...overrides,
	});

	describe("get (backup fields)", () => {
		it("reads a document stored before backups existed with every backup field empty", async () => {
			await mongoose.connection.collection(CONNECT_STATE_COLLECTION).insertOne({ singleton: true, enrollment: null });

			await expect(repo.get()).resolves.toEqual({ enrollment: null, remoteAccessEnabled: false, ...emptyBackupState });
		});
	});

	describe("setRecoveryKeyIfUnset", () => {
		it("stores the key when none is set", async () => {
			await repo.setEnrollment(enrollment());

			await expect(repo.setRecoveryKeyIfUnset("v1.key")).resolves.toBe(true);
			expect((await repo.get()).recoveryKey).toBe("v1.key");
		});

		it("refuses to replace a key", async () => {
			await repo.setEnrollment(enrollment());
			await repo.setRecoveryKeyIfUnset("v1.first");

			await expect(repo.setRecoveryKeyIfUnset("v1.second")).resolves.toBe(false);
			expect((await repo.get()).recoveryKey).toBe("v1.first");
		});

		it("lets exactly one of several racing writers through", async () => {
			await repo.setEnrollment(enrollment());

			const results = await Promise.all(Array.from({ length: 5 }, (_, i) => repo.setRecoveryKeyIfUnset(`v1.key-${i}`)));

			expect(results.filter(Boolean)).toHaveLength(1);
		});

		it("does not create a document when nothing is stored", async () => {
			await expect(repo.setRecoveryKeyIfUnset("v1.key")).resolves.toBe(false);
			expect(await ConnectStateModel.countDocuments({})).toBe(0);
		});

		it("survives unenrolling", async () => {
			await repo.setEnrollment(enrollment());
			await repo.setRecoveryKeyIfUnset("v1.key");

			await repo.clearEnrollment();

			expect((await repo.get()).recoveryKey).toBe("v1.key");
		});
	});

	describe("setSecrets (recovery key)", () => {
		it("replaces a stored recovery key", async () => {
			await repo.setEnrollment(enrollment());
			await repo.setRecoveryKeyIfUnset("v1.old");

			await repo.setSecrets({ recoveryKey: "v1.new" });

			expect((await repo.get()).recoveryKey).toBe("v1.new");
		});

		it("never creates a recovery key", async () => {
			await repo.setEnrollment(enrollment());

			await repo.setSecrets({ recoveryKey: "v1.new" });

			expect((await repo.get()).recoveryKey).toBeNull();
		});

		it("rotates a recovery key that outlived the enrollment", async () => {
			await repo.setEnrollment(enrollment());
			await repo.setRecoveryKeyIfUnset("v1.old");
			await repo.clearEnrollment();

			await repo.setSecrets({ recoveryKey: "v1.new" });

			expect((await repo.get()).recoveryKey).toBe("v1.new");
		});
	});

	describe("operations", () => {
		it("records one operation at a time", async () => {
			await repo.setEnrollment(enrollment());

			await expect(repo.requestOperation(operation())).resolves.toBe(true);
			await expect(repo.requestOperation(operation())).resolves.toBe(false);
			expect((await repo.get()).operation).toEqual(operation());
		});

		it("lets exactly one of several racing requests through", async () => {
			await repo.setEnrollment(enrollment());

			const results = await Promise.all(Array.from({ length: 5 }, () => repo.requestOperation(operation())));

			expect(results.filter(Boolean)).toHaveLength(1);
		});

		it("rejects an operation with an unknown type", async () => {
			await repo.setEnrollment(enrollment());

			await expect(repo.requestOperation({ ...operation(), type: "wipe" as unknown as "backup" })).rejects.toThrow();
		});

		it("marks the operation started", async () => {
			await repo.setEnrollment(enrollment());
			await repo.requestOperation(operation());
			const at = new Date("2026-11-11T10:01:00.000Z");

			await repo.markOperationStarted(at);

			expect((await repo.get()).operation?.startedAt).toEqual(at);
		});

		it("records progress only while an operation is recorded", async () => {
			await repo.setEnrollment(enrollment());
			const progress = { operation: "backup" as const, stage: "uploading" as const, percent: 40, bytes: null };

			await repo.setProgress(progress);
			expect((await repo.get()).progress).toBeNull();

			await repo.requestOperation(operation());
			await repo.setProgress(progress);
			expect((await repo.get()).progress).toEqual(progress);
		});

		it("clears the operation and its progress", async () => {
			await repo.setEnrollment(enrollment());
			await repo.requestOperation(operation());
			await repo.setProgress({ operation: "backup", stage: "dumping", percent: null, bytes: 10 });

			await repo.clearOperation();

			const state = await repo.get();
			expect(state.operation).toBeNull();
			expect(state.progress).toBeNull();
		});

		it("clears stale progress when a new operation is requested", async () => {
			await repo.setEnrollment(enrollment());
			await repo.requestOperation(operation());
			await repo.setProgress({ operation: "backup", stage: "saving", percent: null, bytes: null });
			await ConnectStateModel.updateOne({ singleton: true }, { $set: { operation: null } });

			await repo.requestOperation(operation());

			expect((await repo.get()).progress).toBeNull();
		});
	});

	describe("setLastBackup", () => {
		it("stores the latest result", async () => {
			const failed = result({ ok: false, error: "blob upload failed (500)", sizeBytes: null, sha256: null, backupId: null, durationMs: null });
			await repo.setEnrollment(enrollment());

			await repo.setLastBackup(result());
			await repo.setLastBackup(failed);

			expect((await repo.get()).lastBackup).toEqual(failed);
		});
	});
});
