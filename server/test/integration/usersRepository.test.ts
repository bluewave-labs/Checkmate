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

	describe("sso identity", () => {
		const sso = (subject: string) => ({
			provider: "entra",
			tenant: "tenant-1",
			subject,
			roleManaged: false,
			lastCheckedAt: null,
			deactivatedBySso: false,
		});

		it("findBySsoIdentity finds a linked user", async () => {
			const id = await insertRaw("sso@example.com", { sso: sso("sub-1") });
			await insertRaw("other@example.com");

			const found = await repo.findBySsoIdentity("entra", "tenant-1", "sub-1");

			expect(found?.id).toBe(id);
			expect(found?.sso).toEqual(sso("sub-1"));
			await expect(repo.findBySsoIdentity("entra", "tenant-1", "missing")).resolves.toBeNull();
		});

		it("rejects a second user with the same SSO identity", async () => {
			await UserModel.create({ firstName: "A", lastName: "A", email: "a@example.com", sso: sso("dup") });

			await expect(UserModel.create({ firstName: "B", lastName: "B", email: "b@example.com", sso: sso("dup") })).rejects.toMatchObject({
				code: 11000,
			});
		});

		it("allows many users without an SSO identity", async () => {
			await UserModel.create({ firstName: "A", lastName: "A", email: "a@example.com", password: "hash" });
			await UserModel.create({ firstName: "B", lastName: "B", email: "b@example.com", password: "hash" });

			await expect(UserModel.countDocuments({})).resolves.toBe(2);
		});

		it("findByEmailOrNull returns null for an unknown email", async () => {
			await insertRaw("known@example.com");

			await expect(repo.findByEmailOrNull("known@example.com")).resolves.toMatchObject({ email: "known@example.com" });
			await expect(repo.findByEmailOrNull("nobody@example.com")).resolves.toBeNull();
		});

		it("setSso links an identity to a user", async () => {
			const id = await insertRaw("link@example.com");

			const updated = await repo.setSso(id, sso("sub-9"));

			expect(updated.sso).toEqual(sso("sub-9"));
			await expect(repo.findBySsoIdentity("entra", "tenant-1", "sub-9")).resolves.toMatchObject({ id });
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
