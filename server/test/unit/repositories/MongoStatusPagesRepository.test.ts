import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import MongoStatusPagesRepository from "../../../src/repositories/status-pages/MongoStatusPagesRepository.ts";
import StatusPageModel from "../../../src/db/models/StatusPage.ts";

describe("MongoStatusPagesRepository — password fields", () => {
	let memServer: MongoMemoryServer;

	beforeEach(async () => {
		memServer = await MongoMemoryServer.create();
		await mongoose.connect(memServer.getUri());
	});

	afterEach(async () => {
		await mongoose.disconnect();
		await memServer.stop();
	});

	const seedPage = (overrides: Record<string, unknown> = {}) =>
		StatusPageModel.create({
			userId: new mongoose.Types.ObjectId(),
			teamId: new mongoose.Types.ObjectId(),
			companyName: "Acme",
			url: "acme",
			monitors: [new mongoose.Types.ObjectId()],
			subMonitors: [],
			isPublished: true,
			...overrides,
		});

	it("toEntity exposes passwordProtected=false when no hash", async () => {
		const repo = new MongoStatusPagesRepository();
		await seedPage();
		const entity = await repo.findByUrl("acme");
		expect(entity.passwordProtected).toBe(false);
	});

	it("toEntity exposes passwordProtected=true when hash is set", async () => {
		const repo = new MongoStatusPagesRepository();
		await seedPage({ passwordHash: "$2a$10$dummyhashvalueforunit" });
		const entity = await repo.findByUrl("acme");
		expect(entity.passwordProtected).toBe(true);
	});

	it("findByUrl never returns passwordHash on the entity", async () => {
		const repo = new MongoStatusPagesRepository();
		await seedPage({ passwordHash: "$2a$10$dummyhashvalueforunit" });
		const entity = (await repo.findByUrl("acme")) as unknown as Record<string, unknown>;
		expect(entity.passwordHash).toBeUndefined();
	});

	it("findByUrlWithSecret returns the hash and version", async () => {
		const repo = new MongoStatusPagesRepository();
		await seedPage({ passwordHash: "$2a$10$abc", passwordVersion: 3 });
		const result = await repo.findByUrlWithSecret("acme");
		expect(result.passwordHash).toBe("$2a$10$abc");
		expect(result.passwordVersion).toBe(3);
		expect(result.id).toBeDefined();
	});

	it("updatePasswordHash writes hash and increments version", async () => {
		const repo = new MongoStatusPagesRepository();
		const seeded = await seedPage();
		await repo.updatePasswordHash(seeded.id.toString(), "$2a$10$newhash");
		const raw = await StatusPageModel.findById(seeded.id).select("+passwordHash").lean();
		expect(raw?.passwordHash).toBe("$2a$10$newhash");
		expect(raw?.passwordVersion).toBe(1);
	});

	it("updatePasswordHash(null) clears hash and increments version", async () => {
		const repo = new MongoStatusPagesRepository();
		const seeded = await seedPage({ passwordHash: "$2a$10$abc", passwordVersion: 2 });
		await repo.updatePasswordHash(seeded.id.toString(), null);
		const raw = await StatusPageModel.findById(seeded.id).select("+passwordHash").lean();
		expect(raw?.passwordHash).toBeNull();
		expect(raw?.passwordVersion).toBe(3);
	});
});
