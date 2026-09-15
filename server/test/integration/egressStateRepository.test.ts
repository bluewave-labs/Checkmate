import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoEgressStateRepository from "../../src/domain/egress/egress-state.repository.mongo.ts";
import { EgressStateModel } from "../../src/domain/egress/egress-state.model.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// The transitions here are the guarantees several worker processes rely on: exactly one
// caller flips ok -> degraded (and degraded -> ok), and a plain read never writes. Both are
// MongoDB filter/update semantics, so they need a live engine.

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await EgressStateModel.init(); // unique index on singleton
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await EgressStateModel.deleteMany({});
});

const probe = (target: string, reachable: boolean) => ({ target, reachable, responseTime: 5, message: reachable ? "Success" : "timeout" });
const NOW = new Date("2026-01-01T10:00:00.000Z");
const LATER = new Date("2026-01-01T10:05:00.000Z");

describe("MongoEgressStateRepository", () => {
	const repo = new MongoEgressStateRepository();

	describe("findSingleton", () => {
		it("creates the ok singleton on first call and returns the same document afterwards", async () => {
			const first = await repo.findSingleton();
			const second = await repo.findSingleton();

			expect(first.status).toBe("ok");
			expect(second.id).toBe(first.id);
			expect(await EgressStateModel.countDocuments()).toBe(1);
		});

		it("does not bump updatedAt on a read", async () => {
			const created = await repo.findSingleton();
			await new Promise((resolve) => setTimeout(resolve, 20));

			const read = await repo.findSingleton();

			expect(read.updatedAt).toBe(created.updatedAt);
		});

		it("survives two processes racing the first insert", async () => {
			const [a, b] = await Promise.all([repo.findSingleton(), repo.findSingleton()]);

			expect(a.id).toBe(b.id);
			expect(await EgressStateModel.countDocuments()).toBe(1);
		});
	});

	describe("markDegraded / markRecovered", () => {
		it("markDegraded does nothing when the singleton has never been created (callers read it first)", async () => {
			expect(await repo.markDegraded([probe("1.1.1.1", false)], NOW)).toBeNull();
			expect(await EgressStateModel.countDocuments()).toBe(0);
		});

		it("lets exactly one caller perform each transition", async () => {
			await repo.findSingleton();

			const [d1, d2] = await Promise.all([repo.markDegraded([probe("1.1.1.1", false)], NOW), repo.markDegraded([probe("1.1.1.1", false)], NOW)]);
			expect([d1, d2].filter((result) => result !== null)).toHaveLength(1);
			expect((await repo.findSingleton()).status).toBe("degraded");

			const [r1, r2] = await Promise.all([repo.markRecovered([probe("1.1.1.1", true)], LATER), repo.markRecovered([probe("1.1.1.1", true)], LATER)]);
			expect([r1, r2].filter((result) => result !== null)).toHaveLength(1);
			const state = await repo.findSingleton();
			expect(state.status).toBe("ok");
			expect(state.degradedSince).toBe(NOW.toISOString());
			expect(state.lastRecoveredAt).toBe(LATER.toISOString());
		});

		it("markRecovered is a no-op while ok and markDegraded is a no-op while degraded", async () => {
			await repo.findSingleton();
			expect(await repo.markRecovered([probe("1.1.1.1", true)], NOW)).toBeNull();

			await repo.markDegraded([probe("1.1.1.1", false)], NOW);
			expect(await repo.markDegraded([probe("1.1.1.1", false)], LATER)).toBeNull();
			expect((await repo.findSingleton()).degradedSince).toBe(NOW.toISOString());
		});
	});

	describe("recordProbe", () => {
		it("stores the probe without changing the status", async () => {
			await repo.findSingleton();
			await repo.markDegraded([probe("1.1.1.1", false)], NOW);

			const state = await repo.recordProbe([probe("1.1.1.1", false), probe("8.8.8.8", false)], LATER);

			expect(state.status).toBe("degraded");
			expect(state.lastProbeAt).toBe(LATER.toISOString());
			expect(state.lastProbeResults.map((result) => result.target)).toEqual(["1.1.1.1", "8.8.8.8"]);
		});
	});

	describe("reset", () => {
		it("returns a degraded singleton to ok with no episode and keeps the recovery history", async () => {
			await repo.findSingleton();
			await repo.markDegraded([probe("1.1.1.1", false)], NOW);
			await repo.markRecovered([probe("1.1.1.1", true)], LATER);
			await repo.markDegraded([probe("1.1.1.1", false)], LATER);

			const state = await repo.reset();

			expect(state.status).toBe("ok");
			expect(state.degradedSince).toBeNull();
			expect(state.lastProbeAt).toBeNull();
			expect(state.lastProbeResults).toEqual([]);
			expect(state.lastRecoveredAt).toBe(LATER.toISOString());
		});

		it("creates the singleton when none exists", async () => {
			const state = await repo.reset();

			expect(state.status).toBe("ok");
			expect(await EgressStateModel.countDocuments()).toBe(1);
		});
	});
});
