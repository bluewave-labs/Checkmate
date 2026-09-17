import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MonitorModel } from "../../src/domain/monitors/monitor.model.ts";
import MongoMonitorsRepository from "../../src/domain/monitors/monitor.repository.mongo.ts";

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await MonitorModel.init();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await MonitorModel.deleteMany({});
});

const seedMonitor = (teamId: mongoose.Types.ObjectId, name: string, tags: mongoose.Types.ObjectId[]) =>
	MonitorModel.create({
		userId: new mongoose.Types.ObjectId(),
		teamId,
		name,
		type: "http",
		url: "https://example.com",
		tags,
	});

const makeSnapshot = (id: string, dayOfMonth: number) => ({
	id,
	status: true,
	responseTime: 100,
	createdAt: new Date(2026, 7, dayOfMonth),
});

const seedMonitorWithChecks = (teamId: mongoose.Types.ObjectId, name: string, type: string, snapshotIds: string[]) =>
	MonitorModel.create({
		userId: new mongoose.Types.ObjectId(),
		teamId,
		name,
		type,
		url: "https://example.com",
		recentChecks: snapshotIds.map((id, i) => makeSnapshot(id, i + 1)),
	});

describe("MongoMonitorsRepository", () => {
	describe("tag filtering", () => {
		it("matches ObjectId tag references when filters arrive as query strings", async () => {
			const repo = new MongoMonitorsRepository();
			const teamId = new mongoose.Types.ObjectId();
			const selectedTagId = new mongoose.Types.ObjectId();
			const otherTagId = new mongoose.Types.ObjectId();

			await seedMonitor(teamId, "selected", [selectedTagId]);
			await seedMonitor(teamId, "not-selected", [otherTagId]);
			await seedMonitor(new mongoose.Types.ObjectId(), "other-team", [selectedTagId]);

			const tags = selectedTagId.toString();
			const monitors = await repo.findByTeamIdWithStats(teamId.toString(), { tags });
			const summary = await repo.findMonitorsSummaryByTeamId(teamId.toString(), { tags });

			expect(monitors.map((monitor) => monitor.name)).toEqual(["selected"]);
			expect(summary.totalMonitors).toBe(1);
		});
	});

	describe("findByIds recentChecks modes", () => {
		const seedFixtures = async () => {
			const teamId = new mongoose.Types.ObjectId();
			const hardware = await seedMonitorWithChecks(teamId, "hw", "hardware", ["hw-1", "hw-2", "hw-3"]);
			const http = await seedMonitorWithChecks(teamId, "web", "http", ["web-1", "web-2"]);
			return { ids: [hardware._id.toString(), http._id.toString()] };
		};

		const checksByName = (monitors: Awaited<ReturnType<MongoMonitorsRepository["findByIds"]>>) =>
			Object.fromEntries(monitors.map((monitor) => [monitor.name, monitor.recentChecks.map((check) => check.id)]));

		it("returns full recentChecks by default and for mode 'all'", async () => {
			const repo = new MongoMonitorsRepository();
			const { ids } = await seedFixtures();

			const byDefault = await repo.findByIds(ids);
			const byAll = await repo.findByIds(ids, { recentChecks: "all" });

			for (const monitors of [byDefault, byAll]) {
				expect(checksByName(monitors)).toEqual({ hw: ["hw-1", "hw-2", "hw-3"], web: ["web-1", "web-2"] });
			}
		});

		it("strips recentChecks for mode 'none'", async () => {
			const repo = new MongoMonitorsRepository();
			const { ids } = await seedFixtures();

			const monitors = await repo.findByIds(ids, { recentChecks: "none" });

			expect(checksByName(monitors)).toEqual({ hw: [], web: [] });
		});

		it("keeps only the newest snapshot for hardware monitors in 'latestHardware' mode", async () => {
			const repo = new MongoMonitorsRepository();
			const { ids } = await seedFixtures();

			const monitors = await repo.findByIds(ids, { recentChecks: "latestHardware" });

			expect(checksByName(monitors)).toEqual({ hw: ["hw-3"], web: [] });
		});

		it("returns an empty array in 'latestHardware' mode for a hardware monitor with no recentChecks field at all", async () => {
			const repo = new MongoMonitorsRepository();
			const teamId = new mongoose.Types.ObjectId();
			const hardware = await seedMonitorWithChecks(teamId, "hw-fresh", "hardware", []);
			// $slice on a missing operand is a hard aggregation error; the $ifNull guard must cover it
			await MonitorModel.updateOne({ _id: hardware._id }, { $unset: { recentChecks: 1 } });

			const monitors = await repo.findByIds([hardware._id.toString()], { recentChecks: "latestHardware" });

			expect(monitors).toHaveLength(1);
			expect(monitors[0].recentChecks).toEqual([]);
		});
	});

	describe("docker tls key access", () => {
		const seedDockerMonitor = (overrides: Record<string, unknown> = {}) =>
			MonitorModel.create({
				userId: new mongoose.Types.ObjectId(),
				teamId: new mongoose.Types.ObjectId(),
				name: "docker",
				type: "docker",
				url: "tcp://host",
				...overrides,
			});

		it("never returns the key on a normal load, even with the flag set", async () => {
			const repo = new MongoMonitorsRepository();
			const doc = await seedDockerMonitor({ dockerTlsKey: "v1.abc123.iv.tag.data", dockerTlsKeySet: true });

			const monitor = await repo.findByIdLean(doc._id.toString());

			expect(monitor?.dockerTlsKeySet).toBe(true);
			expect(monitor?.dockerTlsKey).toBeUndefined();
		});

		it("findDockerTlsKeyById returns the stored key despite select: false", async () => {
			const repo = new MongoMonitorsRepository();
			const doc = await seedDockerMonitor({ dockerTlsKey: "v1.abc123.iv.tag.data", dockerTlsKeySet: true });

			await expect(repo.findDockerTlsKeyById(doc._id.toString())).resolves.toBe("v1.abc123.iv.tag.data");
		});

		it("findDockerTlsKeyById returns null for a monitor without a key and for an unknown id", async () => {
			const repo = new MongoMonitorsRepository();
			const doc = await seedDockerMonitor({ url: "unix:///var/run/docker.sock" });

			await expect(repo.findDockerTlsKeyById(doc._id.toString())).resolves.toBeNull();
			await expect(repo.findDockerTlsKeyById(new mongoose.Types.ObjectId().toString())).resolves.toBeNull();
		});

		it("findAllDockerTlsKeys returns only rows with the flag set and a key present", async () => {
			const repo = new MongoMonitorsRepository();
			const keyed = await seedDockerMonitor({ dockerTlsKey: "v1.abc123.k1", dockerTlsKeySet: true });
			await seedDockerMonitor({ url: "unix:///var/run/docker.sock" });
			await seedDockerMonitor({ dockerTlsKeySet: true }); // flag without key: inconsistent, dropped
			await MonitorModel.create({
				userId: new mongoose.Types.ObjectId(),
				teamId: new mongoose.Types.ObjectId(),
				name: "http",
				type: "http",
				url: "https://example.com",
			});

			await expect(repo.findAllDockerTlsKeys()).resolves.toEqual([{ id: keyed._id.toString(), dockerTlsKey: "v1.abc123.k1" }]);
		});

		it("updateDockerTlsKey replaces the key and nothing else", async () => {
			const repo = new MongoMonitorsRepository();
			const doc = await seedDockerMonitor({ dockerTlsKey: "v1.old.k", dockerTlsKeySet: true, dockerTlsCert: "cert" });

			await repo.updateDockerTlsKey(doc._id.toString(), "v1.new.k");

			const after = await MonitorModel.findById(doc._id).select("+dockerTlsKey").lean();
			expect(after?.dockerTlsKey).toBe("v1.new.k");
			expect(after?.dockerTlsCert).toBe("cert");
			expect(after?.dockerTlsKeySet).toBe(true);
			expect(after?.name).toBe("docker");
		});
	});
});
