import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoConnectRepository from "../../src/domain/connect/connect.repository.mongo.ts";
import { ConnectStateModel } from "../../src/domain/connect/connect.model.ts";
import { CONNECT_STATE_COLLECTION, type ConnectEnrollment } from "../../src/domain/connect/connect.type.ts";

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

describe("MongoConnectRepository", () => {
	const repo = new MongoConnectRepository();

	describe("get", () => {
		it("returns the empty state when nothing has been stored", async () => {
			await expect(repo.get()).resolves.toEqual({ enrollment: null, remoteAccessEnabled: false });
		});

		it("returns only the state fields", async () => {
			await repo.setEnrollment(enrollment());

			await expect(repo.get()).resolves.toEqual({ enrollment: enrollment(), remoteAccessEnabled: false });
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

			await expect(repo.get()).resolves.toEqual({ enrollment: enrollment({ token: "v1.reencrypted-token" }), remoteAccessEnabled: false });
		});

		it("does nothing when not enrolled", async () => {
			await repo.setEnrollment(enrollment());
			await repo.clearEnrollment();

			await expect(repo.setSecrets({ token: "v1.reencrypted-token" })).resolves.toBeUndefined();
			await expect(repo.get()).resolves.toEqual({ enrollment: null, remoteAccessEnabled: false });
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
			await expect(repo.get()).resolves.toEqual({ enrollment: enrollment(), remoteAccessEnabled: true });

			await repo.setRemoteAccess(false);
			await expect(repo.get()).resolves.toEqual({ enrollment: enrollment(), remoteAccessEnabled: false });
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

			await expect(repo.get()).resolves.toEqual({ enrollment: null, remoteAccessEnabled: false });
			expect(await ConnectStateModel.countDocuments({})).toBe(1);
		});

		it("does not create a document when never enrolled", async () => {
			await repo.clearEnrollment();

			expect(await ConnectStateModel.countDocuments({})).toBe(0);
		});
	});
});
