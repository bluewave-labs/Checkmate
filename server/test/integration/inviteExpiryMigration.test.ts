import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { InviteModel } from "../../src/domain/invites/invite.model.ts";
import { convertInviteExpiryToAbsoluteTtl } from "../../src/db/migration/0013_convertInviteExpiryToAbsoluteTtl.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

const logger = createMockLogger();

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// Legacy invites are inserted through the raw driver, NOT InviteModel.create — the
// schema now marks `expiry` required and would reject a doc shaped the pre-migration
// way, and create() would stamp a fresh absolute expiry, defeating the test.
//
// Indexes are torn down between tests because the migration's job is partly to remove
// the legacy fixed-window index; Mongo rejects two indexes on the same key with
// different options, so each test builds the index state it needs from scratch.

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

const insertLegacyInvite = async (email: string, expiry: Date) => {
	await InviteModel.collection.insertOne({
		email,
		teamId: makeId(),
		role: ["user"],
		token: "legacy-token",
		expiry, // pre-migration: this held the CREATION time, not the expiry moment
	});
};

describe("0013_convertInviteExpiryToAbsoluteTtl", () => {
	it("advances a legacy invite's expiry by the old 1-hour window so it expires at the same moment as before", async () => {
		const createdAt = new Date("2026-01-01T00:00:00Z");
		await insertLegacyInvite("legacy@example.com", createdAt);

		await convertInviteExpiryToAbsoluteTtl(logger);

		const doc = await InviteModel.collection.findOne({ email: "legacy@example.com" });
		// Old behaviour: deleted 3600s after `expiry` (the creation time). New behaviour:
		// deleted once "now" passes `expiry`. Same wall-clock moment either way.
		expect(doc?.expiry.getTime()).toBe(createdAt.getTime() + LEGACY_INVITE_TTL_SECONDS * 1000);
	});

	it("converts every invite in the collection", async () => {
		const createdAt = new Date("2026-01-01T00:00:00Z");
		await insertLegacyInvite("one@example.com", createdAt);
		await insertLegacyInvite("two@example.com", createdAt);

		await convertInviteExpiryToAbsoluteTtl(logger);

		const docs = await InviteModel.collection.find({}).toArray();
		expect(docs).toHaveLength(2);
		for (const doc of docs) {
			expect(doc.expiry.getTime()).toBe(createdAt.getTime() + HOUR_IN_MS);
		}
	});

	it("drops the legacy fixed-window TTL index so syncIndexes() can create the per-document one", async () => {
		await InviteModel.collection.createIndex({ expiry: 1 }, { expireAfterSeconds: LEGACY_INVITE_TTL_SECONDS });

		await convertInviteExpiryToAbsoluteTtl(logger);

		const indexes = await InviteModel.collection.indexes();
		const legacy = indexes.find((index) => index.key?.expiry === 1 && index.expireAfterSeconds === LEGACY_INVITE_TTL_SECONDS);
		expect(legacy).toBeUndefined();
	});

	it("leaves an already-converted per-document TTL index in place", async () => {
		await InviteModel.collection.createIndex({ expiry: 1 }, { expireAfterSeconds: 0 });

		await convertInviteExpiryToAbsoluteTtl(logger);

		const indexes = await InviteModel.collection.indexes();
		const current = indexes.find((index) => index.key?.expiry === 1);
		expect(current?.expireAfterSeconds).toBe(0);
	});

	it("does not throw on a fresh deployment with no invites and no legacy index", async () => {
		await expect(convertInviteExpiryToAbsoluteTtl(logger)).resolves.toBeUndefined();
	});
});
