import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { InviteModel } from "../../src/domain/invites/invite.model.ts";
import { convertInviteExpiryToAbsoluteTtl } from "../../src/db/migration/0013_convertInviteExpiryToAbsoluteTtl.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

const logger = createMockLogger();

const LEGACY_INVITE_TTL_SECONDS = 3600;
const HOUR_IN_MS = 60 * 60 * 1000;

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await InviteModel.collection.deleteMany({});
	await InviteModel.collection.dropIndexes();
});

const makeId = () => new mongoose.Types.ObjectId();

const createLegacyIndex = () => InviteModel.collection.createIndex({ expiry: 1 }, { expireAfterSeconds: LEGACY_INVITE_TTL_SECONDS });

const insertLegacyInvite = async (email: string, expiry: Date) => {
	await InviteModel.collection.insertOne({
		email,
		teamId: makeId(),
		role: ["user"],
		token: `token-${email}`,
		expiry,
	});
};

const expiryOf = async (email: string) => {
	const doc = await InviteModel.collection.findOne({ email });
	return doc?.expiry.getTime();
};

describe("0013_convertInviteExpiryToAbsoluteTtl", () => {
	it("advances a legacy invite's expiry by the old 1-hour window so it expires at the same moment as before", async () => {
		const createdAt = new Date("2026-01-01T00:00:00Z");
		await createLegacyIndex();
		await insertLegacyInvite("legacy@example.com", createdAt);

		await convertInviteExpiryToAbsoluteTtl(logger);

		expect(await expiryOf("legacy@example.com")).toBe(createdAt.getTime() + HOUR_IN_MS);
	});

	it("converts every invite in the collection", async () => {
		const createdAt = new Date("2026-01-01T00:00:00Z");
		await createLegacyIndex();
		await insertLegacyInvite("one@example.com", createdAt);
		await insertLegacyInvite("two@example.com", createdAt);

		await convertInviteExpiryToAbsoluteTtl(logger);

		expect(await expiryOf("one@example.com")).toBe(createdAt.getTime() + HOUR_IN_MS);
		expect(await expiryOf("two@example.com")).toBe(createdAt.getTime() + HOUR_IN_MS);
	});

	it("drops the legacy fixed-window TTL index so syncIndexes() can create the per-document one", async () => {
		await createLegacyIndex();

		await convertInviteExpiryToAbsoluteTtl(logger);

		const indexes = await InviteModel.collection.indexes();
		const legacy = indexes.find((index) => index.key?.expiry === 1 && index.expireAfterSeconds === LEGACY_INVITE_TTL_SECONDS);
		expect(legacy).toBeUndefined();
	});

	it("is idempotent: a second run does not shift expiry again", async () => {
		const createdAt = new Date("2026-01-01T00:00:00Z");
		await createLegacyIndex();
		await insertLegacyInvite("legacy@example.com", createdAt);

		await convertInviteExpiryToAbsoluteTtl(logger);
		await convertInviteExpiryToAbsoluteTtl(logger);
		await convertInviteExpiryToAbsoluteTtl(logger);

		expect(await expiryOf("legacy@example.com")).toBe(createdAt.getTime() + HOUR_IN_MS);
	});

	it("leaves an already-converted per-document TTL index and its data alone", async () => {
		const alreadyAbsolute = new Date("2026-06-01T00:00:00Z");
		await InviteModel.collection.createIndex({ expiry: 1 }, { expireAfterSeconds: 0 });
		await insertLegacyInvite("converted@example.com", alreadyAbsolute);

		await convertInviteExpiryToAbsoluteTtl(logger);

		expect(await expiryOf("converted@example.com")).toBe(alreadyAbsolute.getTime());
		const indexes = await InviteModel.collection.indexes();
		expect(indexes.find((index) => index.key?.expiry === 1)?.expireAfterSeconds).toBe(0);
	});

	it("does not throw on a fresh deployment with no invites and no legacy index", async () => {
		await expect(convertInviteExpiryToAbsoluteTtl(logger)).resolves.toBeUndefined();
	});
});
