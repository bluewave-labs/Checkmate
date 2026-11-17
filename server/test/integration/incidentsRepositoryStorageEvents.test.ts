import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { IncidentModel } from "../../src/domain/incidents/incident.model.ts";
import MongoIncidentsRepository from "../../src/domain/incidents/incident.repository.mongo.ts";

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
	await IncidentModel.deleteMany({});
});

const id = () => new mongoose.Types.ObjectId().toString();

const setup = async () => {
	const repo = new MongoIncidentsRepository();
	const teamId = id();
	const monitorId = id();
	const failed = { subject: "WD-1", reason: "drive_failed" as const, detail: "health FAILED", device: "/dev/sdb", model: "WDC" };
	const degraded = { subject: "/dev/md1", reason: "array_degraded" as const, detail: "degraded, 1 of 2 disks missing" };
	const other = { subject: "WD-2", reason: "drive_warning" as const, detail: "pending sectors 3", device: "/dev/sdc" };
	return { repo, teamId, monitorId, failed, degraded, other };
};

describe("MongoIncidentsRepository storage events", () => {
	it("stores events on create and maps them back", async () => {
		const { repo, teamId, monitorId, failed } = await setup();

		const incident = await repo.create({
			monitorId,
			teamId,
			startTime: Date.now().toString(),
			cause: "storage",
			storageEvents: [{ ...failed, at: "2026-11-09T21:14:00.000Z" }],
		});

		expect(incident.storageEvents).toEqual([{ ...failed, at: "2026-11-09T21:14:00.000Z" }]);
	});

	it("defaults to no events", async () => {
		const { repo, teamId, monitorId } = await setup();
		const incident = await repo.create({ monitorId, teamId, startTime: Date.now().toString(), cause: "down" });
		expect(incident.storageEvents).toEqual([]);
	});

	it("appends events to an open incident", async () => {
		const { repo, teamId, monitorId, failed, degraded } = await setup();
		const incident = await repo.create({ monitorId, teamId, startTime: Date.now().toString(), cause: "threshold" });

		await repo.appendStorageEvents(incident.id, teamId, [{ ...failed, at: "2026-11-09T21:14:00.000Z" }]);
		const updated = await repo.appendStorageEvents(incident.id, teamId, [{ ...degraded, at: "2026-11-09T21:16:00.000Z" }]);

		expect(updated.storageEvents.map((event) => event.subject)).toEqual(["WD-1", "/dev/md1"]);
		expect(updated.cause).toBe("threshold");
	});

	it("does not append to another team's incident", async () => {
		const { repo, teamId, monitorId, failed } = await setup();
		const incident = await repo.create({ monitorId, teamId, startTime: Date.now().toString() });

		await expect(repo.appendStorageEvents(incident.id, id(), [{ ...failed, at: "2026-11-09T21:14:00.000Z" }])).rejects.toThrow();
	});

	it("lists only the asked subjects, newest first, with each incident's state", async () => {
		const { repo, teamId, monitorId, failed, degraded, other } = await setup();
		const older = await repo.create({
			monitorId,
			teamId,
			startTime: Date.now().toString(),
			cause: "storage",
			status: false,
			endTime: "2026-11-08T10:00:00.000Z",
			storageEvents: [{ ...failed, detail: "disk failing", at: "2026-11-07T03:02:00.000Z" }],
		});
		const open = await repo.create({
			monitorId,
			teamId,
			startTime: Date.now().toString(),
			cause: "storage",
			storageEvents: [
				{ ...failed, at: "2026-11-09T21:14:00.000Z" },
				{ ...other, at: "2026-11-09T21:15:00.000Z" },
				{ ...degraded, at: "2026-11-09T21:16:00.000Z" },
			],
		});

		const events = await repo.findStorageEvents(monitorId, teamId, ["WD-1", "/dev/md1"], 50);

		expect(events.map((event) => [event.subject, event.at])).toEqual([
			["/dev/md1", "2026-11-09T21:16:00.000Z"],
			["WD-1", "2026-11-09T21:14:00.000Z"],
			["WD-1", "2026-11-07T03:02:00.000Z"],
		]);
		expect(events[1]).toEqual({ ...failed, at: "2026-11-09T21:14:00.000Z", incidentId: open.id, incidentActive: true, incidentEndTime: null });
		expect(events[2]).toMatchObject({ incidentId: older.id, incidentActive: false, incidentEndTime: "2026-11-08T10:00:00.000Z" });
	});

	it("is scoped to the monitor and team, and capped", async () => {
		const { repo, teamId, monitorId, failed } = await setup();
		const events = Array.from({ length: 3 }, (_, i) => ({ ...failed, at: `2026-11-0${i + 1}T00:00:00.000Z` }));
		await repo.create({ monitorId, teamId, startTime: Date.now().toString(), storageEvents: events });
		await repo.create({ monitorId: id(), teamId, startTime: Date.now().toString(), storageEvents: events });

		expect(await repo.findStorageEvents(monitorId, id(), ["WD-1"], 50)).toEqual([]);
		const capped = await repo.findStorageEvents(monitorId, teamId, ["WD-1"], 2);
		expect(capped.map((event) => event.at)).toEqual(["2026-11-03T00:00:00.000Z", "2026-11-02T00:00:00.000Z"]);
	});
});
