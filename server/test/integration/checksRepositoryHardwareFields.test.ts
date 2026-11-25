import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoChecksRepository from "../../src/domain/checks/check.repository.mongo.ts";
import { CheckModel } from "../../src/domain/checks/check.model.ts";
import type { Check, HardwareChecksResult } from "../../src/domain/checks/check.type.ts";
import type { ILogger } from "../../src/utils/logger.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await CheckModel.createCollection();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await CheckModel.deleteMany({});
});

const MONITOR_ID = new mongoose.Types.ObjectId();
const TEAM_ID = new mongoose.Types.ObjectId();
const HARDWARE_FIELDS = ["cpu", "memory", "disk", "host", "errors", "capture", "net", "raid"];
const MINUTE_MS = 60 * 1000;

const HARDWARE_PAYLOAD = {
	cpu: { physical_core: 4, logical_core: 8, frequency: 4800, current_frequency: 4600, temperature: [40, 50], free_percent: 0.5, usage_percent: 0.5 },
	memory: { total_bytes: 1000, available_bytes: 600, used_bytes: 400, usage_percent: 0.4 },
	disk: [{ device: "/dev/sda1", mountpoint: "/", total_bytes: 1000, free_bytes: 700, used_bytes: 300, usage_percent: 0.3 }],
	host: { os: "linux", platform: "ubuntu", kernel_version: "7.0.0", pretty_name: "Ubuntu" },
	capture: { version: "2.0.1", mode: "release" },
	net: [
		{
			name: "eth0",
			bytes_sent: 100,
			bytes_recv: 200,
			packets_sent: 1,
			packets_recv: 2,
			err_in: 0,
			err_out: 0,
			drop_in: 0,
			drop_out: 0,
			fifo_in: 0,
			fifo_out: 0,
		},
	],
};

const yesterdayNoonUtc = () => {
	const date = new Date();
	date.setUTCDate(date.getUTCDate() - 1);
	date.setUTCHours(12, 0, 0, 0);
	return date.getTime();
};

const makeCheck = (type: Check["metadata"]["type"], overrides: Partial<Check> = {}, minutesAfterNoon = 0): Check => {
	const createdAt = new Date(yesterdayNoonUtc() + minutesAfterNoon * MINUTE_MS).toISOString();
	return {
		id: new mongoose.Types.ObjectId().toString(),
		metadata: { monitorId: MONITOR_ID.toString(), teamId: TEAM_ID.toString(), type },
		status: true,
		statusCode: 200,
		responseTime: 100,
		message: "OK",
		createdAt,
		updatedAt: createdAt,
		...overrides,
	};
};

const setup = () => new MongoChecksRepository(createMockLogger() as unknown as ILogger);

const findStored = async (id: string) => {
	const stored = await CheckModel.collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
	if (!stored) throw new Error("check was not stored");
	return stored;
};

describe("MongoChecksRepository hardware fields", () => {
	it("stores no hardware fields on a check of another type", async () => {
		const repo = setup();
		const check = makeCheck("http");
		await repo.createChecks([check]);

		const stored = await findStored(check.id);

		for (const field of HARDWARE_FIELDS) {
			expect(stored).not.toHaveProperty(field);
		}
	});

	it("stores no hardware fields on a hardware check that got no payload", async () => {
		const repo = setup();
		const check = makeCheck("hardware", { status: false, statusCode: 5000, message: "connect ECONNREFUSED" });
		await repo.createChecks([check]);

		const stored = await findStored(check.id);

		for (const field of HARDWARE_FIELDS) {
			expect(stored).not.toHaveProperty(field);
		}
	});

	it("stores the agent's payload as given", async () => {
		const repo = setup();
		const check = makeCheck("hardware", HARDWARE_PAYLOAD);
		await repo.createChecks([check]);

		const stored = await findStored(check.id);

		expect(stored.cpu).toEqual(HARDWARE_PAYLOAD.cpu);
		expect(stored.memory).toEqual(HARDWARE_PAYLOAD.memory);
		expect(stored.host).toEqual(HARDWARE_PAYLOAD.host);
		expect(stored.capture).toEqual(HARDWARE_PAYLOAD.capture);
		expect(stored.net).toEqual(HARDWARE_PAYLOAD.net);
		expect(stored.disk).toEqual([expect.objectContaining(HARDWARE_PAYLOAD.disk[0])]);
		expect(stored).not.toHaveProperty("errors");
	});

	it("returns no hardware fields for a check stored without them", async () => {
		const repo = setup();

		const [httpCheck, failedHardwareCheck] = await repo.createChecks([
			makeCheck("http"),
			makeCheck("hardware", { status: false, statusCode: 5000, message: "connect ECONNREFUSED" }),
		]);

		for (const field of HARDWARE_FIELDS) {
			expect(httpCheck?.[field as keyof Check]).toBeUndefined();
			expect(failedHardwareCheck?.[field as keyof Check]).toBeUndefined();
		}
	});

	it("returns the hardware fields of a check that has them", async () => {
		const repo = setup();

		const [check] = await repo.createChecks([makeCheck("hardware", HARDWARE_PAYLOAD)]);

		expect(check?.cpu).toEqual(HARDWARE_PAYLOAD.cpu);
		expect(check?.memory).toEqual(HARDWARE_PAYLOAD.memory);
		expect(check?.host).toEqual(HARDWARE_PAYLOAD.host);
		expect(check?.capture).toEqual(HARDWARE_PAYLOAD.capture);
		expect(check?.net).toEqual(HARDWARE_PAYLOAD.net);
		expect(check?.disk).toEqual([expect.objectContaining(HARDWARE_PAYLOAD.disk[0])]);
		expect(check?.errors).toBeUndefined();
	});

	it("stores and returns raid arrays as the agent reports them", async () => {
		const repo = setup();
		const raid = [
			{
				device: "/dev/md0",
				level: "raid1",
				state: "clean",
				raid_disks: 2,
				degraded_disks: 0,
				sync_action: "idle",
				sync_progress: null,
				members: [
					{ device: "/dev/sda1", state: "in_sync" },
					{ device: "/dev/sdb1", state: "in_sync" },
				],
			},
			{
				device: "/dev/md1",
				level: "raid1",
				state: "active",
				raid_disks: 2,
				degraded_disks: 1,
				sync_action: "recover",
				sync_progress: 0.25,
				members: [
					{ device: "/dev/sda2", state: "in_sync" },
					{ device: "/dev/sdc2", state: "spare" },
				],
			},
			{
				device: "/dev/md2",
				level: "raid0",
				state: "clean",
				raid_disks: 2,
				degraded_disks: null,
				sync_action: null,
				sync_progress: null,
				members: [
					{ device: "/dev/sdd", state: "in_sync" },
					{ device: "/dev/sde", state: "in_sync" },
				],
			},
			{
				device: "/dev/md127",
				level: "",
				state: "inactive",
				raid_disks: 0,
				degraded_disks: null,
				sync_action: null,
				sync_progress: null,
				members: [{ device: "/dev/sdf", state: "faulty" }],
			},
		];
		const check = makeCheck("hardware", { ...HARDWARE_PAYLOAD, raid });

		const [returned] = await repo.createChecks([check]);
		const stored = await findStored(check.id);

		expect(stored.raid).toEqual(raid);
		expect(returned?.raid).toEqual(raid);
	});

	it("stores an empty raid list when the host has no arrays", async () => {
		const repo = setup();
		const check = makeCheck("hardware", { ...HARDWARE_PAYLOAD, raid: [] });

		const [returned] = await repo.createChecks([check]);
		const stored = await findStored(check.id);

		expect(stored.raid).toEqual([]);
		expect(returned?.raid).toEqual([]);
	});

	it("leaves a failed hardware check out of the usage averages", async () => {
		const repo = setup();
		await repo.createChecks([
			makeCheck("hardware", HARDWARE_PAYLOAD),
			makeCheck("hardware", { status: false, statusCode: 5000, message: "connect ECONNREFUSED" }, 1),
		]);

		const result = (await repo.findByDateRangeAndMonitorId(MONITOR_ID.toString(), "all", { type: "hardware" })) as HardwareChecksResult;

		expect(result.aggregateData.totalChecks).toBe(2);
		expect(result.upChecks.totalChecks).toBe(1);
		expect(result.checks).toHaveLength(1);
		expect(result.checks[0]).toMatchObject({ avgCpuUsage: 0.5, avgMemoryUsage: 0.4, avgTemperature: [40, 50] });
		expect(result.checks[0]?.disks.map((disk) => disk.usagePercent)).toEqual([0.3]);
	});
});
