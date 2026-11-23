import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoChecksRepository from "../../src/domain/checks/check.repository.mongo.ts";
import { CheckModel } from "../../src/domain/checks/check.model.ts";
import type { ILogger } from "../../src/utils/logger.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

let mongod: MongoMemoryServer;
let repository: MongoChecksRepository;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await CheckModel.createCollection();
	repository = new MongoChecksRepository(createMockLogger() as unknown as ILogger);
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

const readExpireAfterSeconds = async (): Promise<number | undefined> => {
	const [info] = await mongoose.connection.db!.listCollections({ name: CheckModel.collection.collectionName }).toArray();
	const value = (info as { options?: { expireAfterSeconds?: unknown } }).options?.expireAfterSeconds;
	return value === undefined ? undefined : Number(value);
};

describe("MongoChecksRepository.setExpireAfterSeconds", () => {
	it("leaves a collection without a TTL untouched when turned off", async () => {
		const applied = await repository.setExpireAfterSeconds(null);

		expect(applied).toBe(true);
		expect(await readExpireAfterSeconds()).toBeUndefined();
	});

	it("sets, repeats and changes the TTL", async () => {
		expect(await repository.setExpireAfterSeconds(2_592_000)).toBe(true);
		expect(await readExpireAfterSeconds()).toBe(2_592_000);

		expect(await repository.setExpireAfterSeconds(2_592_000)).toBe(true);
		expect(await readExpireAfterSeconds()).toBe(2_592_000);

		expect(await repository.setExpireAfterSeconds(7_776_000)).toBe(true);
		expect(await readExpireAfterSeconds()).toBe(7_776_000);
	});

	it("removes the TTL when given null", async () => {
		await repository.setExpireAfterSeconds(2_592_000);
		await repository.setExpireAfterSeconds(null);

		expect(await readExpireAfterSeconds()).toBeUndefined();
	});

	it("returns false when the database refuses with Unauthorized", async () => {
		const db = mongoose.connection.db!;
		const original = db.command.bind(db);
		db.command = (async () => {
			throw new mongoose.mongo.MongoServerError({ message: "not authorized", code: 13, codeName: "Unauthorized" });
		}) as typeof db.command;

		try {
			expect(await repository.setExpireAfterSeconds(2_592_000)).toBe(false);
		} finally {
			db.command = original;
		}
	});

	it("rethrows any other database error", async () => {
		const db = mongoose.connection.db!;
		const original = db.command.bind(db);
		db.command = (async () => {
			throw new Error("connection closed");
		}) as typeof db.command;

		try {
			await expect(repository.setExpireAfterSeconds(2_592_000)).rejects.toThrow("connection closed");
		} finally {
			db.command = original;
		}
	});
});
