import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoMaintenanceWindowsRepository from "../../src/domain/maintenance-windows/maintenance-window.repository.mongo.ts";
import { MaintenanceWindowModel } from "../../src/domain/maintenance-windows/maintenance-window.model.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// Monitor membership edits are persisted by MongoDB's array update semantics. This
// regression suite exercises the repository against a live engine so adding/removing
// monitors cannot silently become a service-only mock assertion.

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await MaintenanceWindowModel.init();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await MaintenanceWindowModel.deleteMany({});
});

const makeId = () => new mongoose.Types.ObjectId();

describe("MongoMaintenanceWindowsRepository", () => {
	describe("updateById", () => {
		it("persists added and removed monitorIds when editing a maintenance window", async () => {
			const repo = new MongoMaintenanceWindowsRepository();
			const teamId = makeId();
			const removedMonitorId = makeId();
			const keptMonitorId = makeId();
			const addedMonitorId = makeId();
			const window = await MaintenanceWindowModel.create({
				teamId,
				monitorIds: [removedMonitorId, keptMonitorId],
				active: true,
				name: "Scheduled maintenance",
				duration: 60,
				durationUnit: "minutes",
				repeat: 0,
				start: new Date("2026-04-10T02:00:00Z"),
				end: new Date("2026-04-10T03:00:00Z"),
			});

			const updated = await repo.updateById(window._id.toString(), teamId.toString(), {
				monitorIds: [keptMonitorId.toString(), addedMonitorId.toString()],
			});

			expect(updated.monitorIds).toEqual([keptMonitorId.toString(), addedMonitorId.toString()]);
			expect(await repo.findByMonitorId(removedMonitorId.toString(), teamId.toString())).toEqual([]);
			expect((await repo.findByMonitorId(keptMonitorId.toString(), teamId.toString())).map((item) => item.id)).toEqual([window._id.toString()]);
			expect((await repo.findByMonitorId(addedMonitorId.toString(), teamId.toString())).map((item) => item.id)).toEqual([window._id.toString()]);
		});
	});

	describe("findByMonitorId", () => {
		it("returns windows that cover the monitor directly or through one of its tags, without duplicates", async () => {
			const repo = new MongoMaintenanceWindowsRepository();
			const teamId = makeId();
			const monitorId = makeId();
			const tagId = makeId();
			const otherTagId = makeId();
			const base = {
				teamId,
				active: true,
				duration: 60,
				durationUnit: "minutes",
				repeat: 0,
				start: new Date("2026-04-10T02:00:00Z"),
				end: new Date("2026-04-10T03:00:00Z"),
			};
			const direct = await MaintenanceWindowModel.create({ ...base, name: "direct", monitorIds: [monitorId], tagIds: [] });
			const viaTag = await MaintenanceWindowModel.create({ ...base, name: "via tag", monitorIds: [], tagIds: [tagId] });
			const both = await MaintenanceWindowModel.create({ ...base, name: "both", monitorIds: [monitorId], tagIds: [tagId] });
			await MaintenanceWindowModel.create({ ...base, name: "unrelated", monitorIds: [makeId()], tagIds: [otherTagId] });

			const found = await repo.findByMonitorId(monitorId.toString(), teamId.toString(), [tagId.toString()]);

			expect(found.map((item) => item.id).sort()).toEqual([direct._id.toString(), viaTag._id.toString(), both._id.toString()].sort());
		});

		it("ignores tag-based windows when the monitor has no tags", async () => {
			const repo = new MongoMaintenanceWindowsRepository();
			const teamId = makeId();
			const monitorId = makeId();
			await MaintenanceWindowModel.create({
				teamId,
				name: "via tag",
				monitorIds: [],
				tagIds: [makeId()],
				active: true,
				duration: 60,
				durationUnit: "minutes",
				repeat: 0,
				start: new Date("2026-04-10T02:00:00Z"),
				end: new Date("2026-04-10T03:00:00Z"),
			});

			expect(await repo.findByMonitorId(monitorId.toString(), teamId.toString(), [])).toEqual([]);
		});
	});

	describe("removeTagFromWindows", () => {
		it("pulls the tag id from every window that references it", async () => {
			const repo = new MongoMaintenanceWindowsRepository();
			const teamId = makeId();
			const tagId = makeId();
			const keptTagId = makeId();
			const window = await MaintenanceWindowModel.create({
				teamId,
				name: "tagged",
				monitorIds: [],
				tagIds: [tagId, keptTagId],
				active: true,
				duration: 60,
				durationUnit: "minutes",
				repeat: 0,
				start: new Date("2026-04-10T02:00:00Z"),
				end: new Date("2026-04-10T03:00:00Z"),
			});

			await repo.removeTagFromWindows(tagId.toString());

			const reloaded = await repo.findById(window._id.toString(), teamId.toString());
			expect(reloaded.tagIds).toEqual([keptTagId.toString()]);
		});
	});
});
