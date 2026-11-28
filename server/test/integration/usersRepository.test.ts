import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoUsersRepository from "../../src/domain/users/user.repository.mongo.ts";
import { UserModel } from "../../src/domain/users/user.model.ts";

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await UserModel.init();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await UserModel.deleteMany({});
});

const insertRaw = async (email: string, extra: Record<string, unknown> = {}) => {
	const _id = new mongoose.Types.ObjectId();
	await UserModel.collection.insertOne({ _id, firstName: "Ada", lastName: "Lovelace", email, password: "hash", role: ["user"], ...extra });
	return _id.toString();
};

describe("MongoUsersRepository", () => {
	const repo = new MongoUsersRepository();

	describe("findAuthState", () => {
		it("treats a user document without isActive as active", async () => {
			const id = await insertRaw("legacy@example.com");
			await expect(repo.findAuthState(id)).resolves.toEqual({ isActive: true, tokensValidAfter: null });
		});

		it("reports a deactivated user and the revocation cutoff", async () => {
			const id = await insertRaw("off@example.com", { isActive: false, tokensValidAfter: 123 });
			await expect(repo.findAuthState(id)).resolves.toEqual({ isActive: false, tokensValidAfter: 123 });
		});

		it("returns null when the user does not exist", async () => {
			await expect(repo.findAuthState(new mongoose.Types.ObjectId().toString())).resolves.toBeNull();
		});
	});

	describe("setTokensValidAfter", () => {
		it("updates every given user", async () => {
			const first = await insertRaw("a@example.com");
			const second = await insertRaw("b@example.com");
			const untouched = await insertRaw("c@example.com");

			await repo.setTokensValidAfter([first, second], 555);

			await expect(repo.findAuthState(first)).resolves.toEqual({ isActive: true, tokensValidAfter: 555 });
			await expect(repo.findAuthState(second)).resolves.toEqual({ isActive: true, tokensValidAfter: 555 });
			await expect(repo.findAuthState(untouched)).resolves.toEqual({ isActive: true, tokensValidAfter: null });
		});
	});
});
