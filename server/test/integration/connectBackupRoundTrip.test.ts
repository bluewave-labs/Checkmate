import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { execFile, spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ConnectBackupTools } from "../../src/domain/connect/connect.backup-tools.ts";
import { decryptFile, encryptToFile } from "../../src/domain/connect/connect.backup-format.ts";
import type { ISettingsService } from "../../src/domain/app-settings/app-settings.service.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

const toolsInstalled = ["mongodump", "mongorestore"].every((tool) => spawnSync(tool, ["--version"]).status === 0);
const describeWithTools = toolsInstalled ? describe : describe.skip;
const KEY = "ab".repeat(32);

let mongod: MongoMemoryServer;

beforeAll(async () => {
	if (!toolsInstalled) return;
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri("source_db"));
}, 120_000);

afterAll(async () => {
	if (!toolsInstalled) return;
	await mongoose.disconnect();
	await mongod.stop();
});

const toolsFor = (dbName: string) => {
	const settings = {
		connectMongodumpBin: "mongodump",
		connectMongorestoreBin: "mongorestore",
		dbConnectionString: mongod.getUri(dbName),
	};
	return new ConnectBackupTools(spawn, execFile, { getSettings: () => settings } as unknown as ISettingsService, createMockLogger() as any);
};

const seal = async (dbName: string, kind: "full" | "config", sealedFile: string) => {
	const tools = toolsFor(dbName);
	await tools.withWorkDir(async (_dir, configFile) => {
		const dump = tools.dump(configFile, dbName, kind);
		await Promise.all([encryptToFile(dump.stdout, sealedFile, KEY, () => undefined), dump.exited]);
	});
};

const restoreInto = async (dbName: string, sealedFile: string) => {
	const tools = toolsFor(dbName);
	await tools.withRestoreWorkDir(async (dir, configFile) => {
		const archive = path.join(dir, "restore.archive.gz");
		expect(await decryptFile(sealedFile, archive, KEY)).toBe(true);
		await tools.restore(configFile, archive, dbName);
	});
};

const withSealedFile = async (work: (sealedFile: string) => Promise<void>) => {
	const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "connect-roundtrip-"));
	try {
		await work(path.join(dir, "backup.cmkb"));
	} finally {
		await fs.promises.rm(dir, { recursive: true, force: true });
	}
};

describeWithTools("Connect backup round trip (real mongodump and mongorestore)", () => {
	it("restores a full backup into a database with a different name, with documents and indexes", async () => {
		const source = mongoose.connection.useDb("source_db");
		await source.collection("monitors").insertMany([{ name: "a" }, { name: "b" }, { name: "c" }]);
		await source.collection("monitors").createIndex({ name: 1 }, { unique: true });
		await source.collection("checks").insertMany(Array.from({ length: 20 }, (_, i) => ({ n: i })));
		await source.collection("connect_state").insertOne({ singleton: true });

		await withSealedFile(async (sealedFile) => {
			await seal("source_db", "full", sealedFile);
			await restoreInto("restored_db", sealedFile);
		});

		const restored = mongoose.connection.useDb("restored_db");
		expect(await restored.collection("monitors").countDocuments()).toBe(3);
		expect(await restored.collection("checks").countDocuments()).toBe(20);
		expect(await restored.collection("connect_state").countDocuments()).toBe(0);
		const indexes = await restored.collection("monitors").indexes();
		expect(indexes.some((index) => index.key.name === 1 && index.unique)).toBe(true);
	}, 120_000);

	it("leaves operational data out of a config backup", async () => {
		await withSealedFile(async (sealedFile) => {
			await seal("source_db", "config", sealedFile);
			await restoreInto("config_db", sealedFile);
		});

		const restored = mongoose.connection.useDb("config_db");
		expect(await restored.collection("monitors").countDocuments()).toBe(3);
		expect(await restored.collection("checks").countDocuments()).toBe(0);
	}, 120_000);

	it("replaces what was there (--drop)", async () => {
		const target = mongoose.connection.useDb("dropped_db");
		await target.collection("monitors").insertMany([{ name: "stale-1" }, { name: "stale-2" }, { name: "stale-3" }, { name: "stale-4" }]);

		await withSealedFile(async (sealedFile) => {
			await seal("source_db", "full", sealedFile);
			await restoreInto("dropped_db", sealedFile);
		});

		expect(await target.collection("monitors").countDocuments()).toBe(3);
		expect(await target.collection("monitors").countDocuments({ name: /^stale/ })).toBe(0);
	}, 120_000);

	it("keeps the current connect_state when restoring", async () => {
		const target = mongoose.connection.useDb("kept_state_db");
		await target.collection("connect_state").insertOne({ singleton: true, marker: "current" });

		await withSealedFile(async (sealedFile) => {
			await seal("source_db", "full", sealedFile);
			await restoreInto("kept_state_db", sealedFile);
		});

		expect(await target.collection("connect_state").findOne({ singleton: true })).toMatchObject({ marker: "current" });
		expect(await target.collection("monitors").countDocuments()).toBe(3);
	}, 120_000);
});
