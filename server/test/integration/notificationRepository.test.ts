import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoNotificationsRepository from "../../src/domain/notifications/notification.repository.mongo.ts";
import { NotificationModel } from "../../src/domain/notifications/notification.model.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// Alerts are sent with whatever the repository mapper returns. A field the schema
// stores but the mapper drops is silently ignored at send time, so this suite reads
// stored channels back through the real repository rather than a mock.

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await NotificationModel.init();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await NotificationModel.deleteMany({});
});

const makeId = () => new mongoose.Types.ObjectId();

describe("MongoNotificationsRepository", () => {
	it("returns ntfy authentication fields when loading channels for sending", async () => {
		const repo = new MongoNotificationsRepository();
		const stored = await NotificationModel.create({
			userId: makeId(),
			teamId: makeId(),
			type: "ntfy",
			notificationName: "Protected topic",
			address: "https://ntfy.example.com",
			topic: "checkmate-alerts",
			ntfyAuthType: "basic",
			ntfyUsername: "alice",
			accessToken: "s3cret",
		});

		const [loaded] = await repo.findNotificationsByIds([stored._id.toString()]);

		expect(loaded).toMatchObject({
			ntfyAuthType: "basic",
			ntfyUsername: "alice",
			accessToken: "s3cret",
		});
	});

	it("returns ntfy authentication fields from findById", async () => {
		const repo = new MongoNotificationsRepository();
		const teamId = makeId();
		const stored = await NotificationModel.create({
			userId: makeId(),
			teamId,
			type: "ntfy",
			notificationName: "Token topic",
			address: "https://ntfy.example.com",
			topic: "checkmate-alerts",
			ntfyAuthType: "token",
			accessToken: "tk_secret",
		});

		const loaded = await repo.findById(stored._id.toString(), teamId.toString());

		expect(loaded.ntfyAuthType).toBe("token");
		expect(loaded.ntfyUsername).toBeUndefined();
	});
});
