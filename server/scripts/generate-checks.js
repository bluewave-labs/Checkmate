import mongoose from "mongoose";
import { MonitorModel } from "../dist/db/models/Monitor.js";
import { CheckModel } from "../dist/db/models/Check.js";

const DEFAULT_MONITOR_ID = "000000000000000000000001";
const DEFAULT_TEAM_ID = "0000000000000000000000aa";
const DEFAULT_USER_ID = "0000000000000000000000bb";
const DEFAULT_MONITOR_TYPE = "http";
const DEFAULT_TOTAL = 1_000_000;
const DEFAULT_BATCH_SIZE = 5_000;

const parseObjectId = (value, fallback) => {
	try {
		return new mongoose.Types.ObjectId(value || fallback);
	} catch (error) {
		console.warn(`Invalid ObjectId '${value}', falling back to '${fallback}'.`);
		return new mongoose.Types.ObjectId(fallback);
	}
};

async function ensureMonitor({ monitorId, teamId, userId, type }) {
	const existing = await MonitorModel.findById(monitorId);
	if (existing) {
		return existing;
	}

	console.log(`Monitor ${monitorId.toString()} not found, creating it.`);
	const monitor = new MonitorModel({
		_id: monitorId,
		userId,
		teamId,
		name: `Seed Monitor ${monitorId.toString()}`,
		description: "Synthetic monitor for performance testing",
		statusWindow: [],
		statusWindowSize: 5,
		statusWindowThreshold: 60,
		type,
		ignoreTlsErrors: false,
		url: "https://example.com",
		isActive: true,
		interval: 60000,
		alertThreshold: 5,
		cpuAlertThreshold: 5,
		memoryAlertThreshold: 5,
		diskAlertThreshold: 5,
		tempAlertThreshold: 5,
		selectedDisks: [],
	});

	await monitor.save();
	return monitor;
}

async function run() {
	const mongoUri = process.env.MONGO_URI ?? "mongodb://localhost:27017/uptime_db";
	const monitorId = parseObjectId(process.env.MONITOR_ID ?? DEFAULT_MONITOR_ID, DEFAULT_MONITOR_ID);
	const teamId = parseObjectId("6971546de1b2bc3de6498e6e");
	const userId = parseObjectId("6971546de1b2bc3de6498e70");
	const monitorType = process.env.MONITOR_TYPE ?? DEFAULT_MONITOR_TYPE;
	const total = Number(process.env.CHECK_TOTAL ?? DEFAULT_TOTAL);
	const batchSize = Number(process.env.CHECK_BATCH_SIZE ?? DEFAULT_BATCH_SIZE);

	console.log(`Connecting to MongoDB at ${mongoUri}`);
	await mongoose.connect(mongoUri);

	await ensureMonitor({ monitorId, teamId, userId, type: monitorType });

	console.log(`Seeding ${total} checks for monitor ${monitorId.toString()} (team ${teamId.toString()}) in batches of ${batchSize}.`);

	const docs = [];
	const startTime = Date.now();

	for (let i = 0; i < total; i += 1) {
		const baseTime = Date.now() - (total - i) * 1000;
		const createdAt = new Date(baseTime);
		docs.push({
			metadata: {
				monitorId,
				teamId,
				type: monitorType,
			},
			status: i % 50 !== 0,
			statusCode: i % 50 !== 0 ? 200 : 500,
			responseTime: Math.floor(Math.random() * 1000),
			message: i % 50 !== 0 ? "OK" : "Error",
			expiry: createdAt,
			createdAt,
			updatedAt: createdAt,
			timings: {
				start: baseTime,
				socket: baseTime,
				lookup: baseTime,
				connect: baseTime,
				secureConnect: baseTime,
				upload: baseTime,
				response: baseTime + 40,
				end: baseTime + 45,
				phases: {
					wait: 0,
					dns: 1,
					tcp: 2,
					tls: 4,
					request: 0,
					firstByte: 30,
					download: 5,
					total: 45,
				},
			},
			cpu: {
				physical_core: 8,
				logical_core: 16,
				frequency: 3600,
				temperature: [50 + Math.random() * 10],
				free_percent: 40,
				usage_percent: Math.random() * 100,
			},
			memory: {
				total_bytes: 32 * 1024 ** 3,
				available_bytes: 16 * 1024 ** 3,
				used_bytes: 16 * 1024 ** 3,
				usage_percent: Math.random() * 100,
			},
			disk: [
				{
					device: "/dev/sda1",
					mountpoint: "/",
					read_speed_bytes: Math.random() * 10_000_000,
					write_speed_bytes: Math.random() * 10_000_000,
					total_bytes: 512 * 1024 ** 3,
					free_bytes: 128 * 1024 ** 3,
					usage_percent: Math.random() * 100,
				},
			],
			host: {
				os: "linux",
				platform: "ubuntu",
				kernel_version: "5.15.0",
			},
			net: [
				{
					name: "eth0",
					bytes_sent: Math.random() * 10_000_000,
					bytes_recv: Math.random() * 10_000_000,
					packets_sent: Math.random() * 1_000_000,
					packets_recv: Math.random() * 1_000_000,
					err_in: 0,
					err_out: 0,
					drop_in: 0,
					drop_out: 0,
					fifo_in: 0,
					fifo_out: 0,
				},
			],
			errors: i % 50 === 0 ? [{ metric: ["uptime"], err: "500" }] : [],
		});

		if (docs.length === batchSize) {
			await CheckModel.insertMany(docs, { ordered: false });
			console.log(`Inserted ${i + 1} / ${total}`);
			docs.length = 0;
		}
	}

	if (docs.length > 0) {
		await CheckModel.insertMany(docs, { ordered: false });
	}

	await mongoose.disconnect();
	const duration = ((Date.now() - startTime) / 1000).toFixed(2);
	console.log(`Finished inserting ${total} checks in ${duration}s`);
}

run().catch((error) => {
	console.error("Failed to seed checks", error);
	process.exit(1);
});
