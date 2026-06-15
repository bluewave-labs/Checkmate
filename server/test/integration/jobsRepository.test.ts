import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoJobsRepository from "../../src/domain/jobs/job.repository.mongo.ts";
import JobModel, { type JobDocument } from "../../src/domain/jobs/job.model.ts";
import { BACKOFF_MS, LOCK_MS, type Job, type JobType } from "../../src/domain/jobs/job.type.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// The headline guarantee of the queue — "exactly one claimer wins" — IS MongoDB's
// single-document atomicity on findOneAndUpdate, so it can only be exercised against a
// live engine. We boot a throwaway in-process mongod for this suite.

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await JobModel.init(); // build the indexes the claim scan relies on
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await JobModel.deleteMany({});
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const NOW = 1_000_000;

// Insert a job row directly, full control over every field. Defaults describe a due,
// unlocked, active check job.
const seedJob = (overrides: Partial<JobDocument> = {}): Promise<JobDocument> =>
	JobModel.create({
		_id: overrides._id ?? `check:${overrides.refId ?? "mon-1"}`,
		type: "check" as JobType,
		refId: "mon-1",
		isActive: true,
		nextScheduledAt: NOW,
		intervalMs: 60_000,
		lockedBy: null,
		lockedUntil: null,
		runCount: 0,
		failCount: 0,
		lastFinishedAt: null,
		lastFailReason: null,
		...overrides,
	});

const readRow = (id: string) => JobModel.findById(id).lean<JobDocument>();

// record*/renewLocks are fenced on the repo's private workerId, so a pre-seeded "held"
// lock must be stamped with the same id the repo will check against.
const ownedBy = (r: MongoJobsRepository) => (r as unknown as { workerId: string }).workerId;

describe("MongoJobsRepository", () => {
	let repo: MongoJobsRepository;

	beforeEach(() => {
		repo = new MongoJobsRepository();
	});

	// ── claimDue ───────────────────────────────────────────────────────────────
	describe("claimDue", () => {
		it("claims a due, unlocked job and leases it", async () => {
			await seedJob();

			const claimed = await repo.claimDue("check", NOW);

			expect(claimed?.id).toBe("check:mon-1");
			const row = await readRow("check:mon-1");
			expect(row?.lockedBy).not.toBeNull();
			expect(row?.lockedUntil).toBe(NOW + LOCK_MS);
		});

		it("returns null when nothing is due yet", async () => {
			await seedJob({ nextScheduledAt: NOW + 1 });
			expect(await repo.claimDue("check", NOW)).toBeNull();
		});

		it("skips inactive (paused) jobs", async () => {
			await seedJob({ isActive: false });
			expect(await repo.claimDue("check", NOW)).toBeNull();
		});

		it("only claims the requested type", async () => {
			await seedJob({ _id: "geo:mon-1", type: "geo-check" });
			expect(await repo.claimDue("check", NOW)).toBeNull();
		});

		it("does not claim a job held by a live lease", async () => {
			await seedJob({ lockedBy: "other-worker", lockedUntil: NOW + LOCK_MS });
			expect(await repo.claimDue("check", NOW)).toBeNull();
		});

		it("reclaims a job whose lease has expired (crash recovery)", async () => {
			await seedJob({ lockedBy: "dead-worker", lockedUntil: NOW - 1 });

			const claimed = await repo.claimDue("check", NOW);

			expect(claimed?.id).toBe("check:mon-1");
			const row = await readRow("check:mon-1");
			expect(row?.lockedBy).not.toBe("dead-worker");
			expect(row?.lockedUntil).toBe(NOW + LOCK_MS);
		});

		it("returns the oldest-due job first", async () => {
			await seedJob({ _id: "check:newer", refId: "newer", nextScheduledAt: NOW });
			await seedJob({ _id: "check:older", refId: "older", nextScheduledAt: NOW - 5_000 });

			const claimed = await repo.claimDue("check", NOW);
			expect(claimed?.id).toBe("check:older");
		});

		it("lets exactly one of many concurrent claimers win a single due job", async () => {
			await seedJob();

			// Distinct repo instances = distinct workerIds = realistic competing workers.
			const workers = Array.from({ length: 20 }, () => new MongoJobsRepository());
			const results = await Promise.all(workers.map((w) => w.claimDue("check", NOW)));

			const winners = results.filter((r): r is Job => r !== null);
			expect(winners).toHaveLength(1);
			expect(winners[0].id).toBe("check:mon-1");
		});

		it("hands two concurrent claimers two distinct due jobs (no double-claim)", async () => {
			await seedJob({ _id: "check:a", refId: "a" });
			await seedJob({ _id: "check:b", refId: "b" });

			const [w1, w2] = [new MongoJobsRepository(), new MongoJobsRepository()];
			const [r1, r2] = await Promise.all([w1.claimDue("check", NOW), w2.claimDue("check", NOW)]);

			expect(r1).not.toBeNull();
			expect(r2).not.toBeNull();
			expect(r1?.id).not.toBe(r2?.id);
			expect([r1?.id, r2?.id].sort()).toEqual(["check:a", "check:b"]);
		});
	});

	// ── recordSuccess (fixed-rate reschedule) ────────────────────────────────────
	describe("recordSuccess", () => {
		it("reschedules fixed-rate from the scheduled tick and releases the lease", async () => {
			await seedJob({ lockedBy: ownedBy(repo), lockedUntil: NOW + LOCK_MS, runCount: 4 });

			const ok = await repo.recordSuccess("check:mon-1", NOW, 60_000, NOW + 1_500);

			expect(ok).toBe(true);
			const row = await readRow("check:mon-1");
			// next tick measured from the scheduled time (NOW), not completion time
			expect(row?.nextScheduledAt).toBe(NOW + 60_000);
			expect(row?.lockedBy).toBeNull();
			expect(row?.lockedUntil).toBeNull();
			expect(row?.lastFinishedAt).toBe(NOW + 1_500);
			expect(row?.runCount).toBe(5);
		});

		it("skips missed ticks when the worker has fallen behind", async () => {
			await seedJob({ lockedBy: ownedBy(repo), lockedUntil: NOW + LOCK_MS });

			// scheduled NOW, interval 60s, but completion is 200s late → NOW+60s is already past
			const now = NOW + 200_000;
			await repo.recordSuccess("check:mon-1", NOW, 60_000, now);

			const row = await readRow("check:mon-1");
			// no catch-up burst: jump to the next aligned tick from now, not NOW+60_000
			expect(row?.nextScheduledAt).toBe(now + 60_000);
		});

		it("returns false for an unknown id", async () => {
			expect(await repo.recordSuccess("missing", NOW, 60_000, NOW)).toBe(false);
		});

		it("does not release a lock owned by another worker (fenced no-op)", async () => {
			// A worker whose lease expired and was reclaimed must not clobber the new owner's lock.
			await seedJob({ lockedBy: "other-worker", lockedUntil: NOW + LOCK_MS, runCount: 7 });

			const ok = await repo.recordSuccess("check:mon-1", NOW, 60_000, NOW + 1_000);

			expect(ok).toBe(false);
			const row = await readRow("check:mon-1");
			expect(row?.lockedBy).toBe("other-worker"); // lock untouched
			expect(row?.lockedUntil).toBe(NOW + LOCK_MS);
			expect(row?.runCount).toBe(7); // not double-counted
		});
	});

	// ── renewLocks (lease renewal) ───────────────────────────────────────────────
	describe("renewLocks", () => {
		it("extends the lease on a lock this worker holds", async () => {
			await seedJob({ lockedBy: ownedBy(repo), lockedUntil: NOW + LOCK_MS });

			const renewed = await repo.renewLocks(["check:mon-1"], NOW + 1_000);

			expect(renewed).toBe(1);
			expect((await readRow("check:mon-1"))?.lockedUntil).toBe(NOW + 1_000 + LOCK_MS);
		});

		it("does not renew a lock held by another worker (fenced)", async () => {
			await seedJob({ lockedBy: "other-worker", lockedUntil: NOW + LOCK_MS });

			const renewed = await repo.renewLocks(["check:mon-1"], NOW + 1_000);

			expect(renewed).toBe(0);
			expect((await readRow("check:mon-1"))?.lockedUntil).toBe(NOW + LOCK_MS); // unchanged
		});

		it("renews only the locks this worker holds out of a mixed batch", async () => {
			await seedJob({ _id: "check:mine", refId: "mine", lockedBy: ownedBy(repo), lockedUntil: NOW + LOCK_MS });
			await seedJob({ _id: "check:theirs", refId: "theirs", lockedBy: "other-worker", lockedUntil: NOW + LOCK_MS });

			const renewed = await repo.renewLocks(["check:mine", "check:theirs"], NOW + 1_000);

			expect(renewed).toBe(1);
			expect((await readRow("check:mine"))?.lockedUntil).toBe(NOW + 1_000 + LOCK_MS);
			expect((await readRow("check:theirs"))?.lockedUntil).toBe(NOW + LOCK_MS);
		});

		it("returns 0 for an empty id list without touching the db", async () => {
			expect(await repo.renewLocks([], NOW)).toBe(0);
		});

		// Regression: a renewed lock keeps a slow-but-alive job from being reclaimed once its
		// original lease would have expired — preventing the duplicate-execution path.
		it("keeps a job from being reclaimed after the original lease window passes", async () => {
			await seedJob();
			await repo.claimDue("check", NOW); // this worker now holds the lease until NOW + LOCK_MS

			// just before expiry, the still-running job renews its own lock
			const renewAt = NOW + LOCK_MS - 1_000;
			expect(await repo.renewLocks(["check:mon-1"], renewAt)).toBe(1);

			// a second worker scans PAST the original lease end — without renewal it would reclaim
			const other = new MongoJobsRepository();
			expect(await other.claimDue("check", NOW + LOCK_MS + 1)).toBeNull();

			const row = await readRow("check:mon-1");
			expect(row?.lockedBy).toBe(ownedBy(repo)); // still held by the original worker
			expect(row?.lockedUntil).toBe(renewAt + LOCK_MS);
		});
	});

	// ── recordFailure (backoff) ──────────────────────────────────────────────────
	describe("recordFailure", () => {
		it("backs off, records the reason, bumps failCount, releases the lease", async () => {
			await seedJob({ lockedBy: ownedBy(repo), lockedUntil: NOW + LOCK_MS, failCount: 2 });

			const ok = await repo.recordFailure("check:mon-1", new Error("connection refused"), NOW);

			expect(ok).toBe(true);
			const row = await readRow("check:mon-1");
			expect(row?.nextScheduledAt).toBe(NOW + BACKOFF_MS);
			expect(row?.lastFailReason).toBe("connection refused");
			expect(row?.failCount).toBe(3);
			expect(row?.lockedBy).toBeNull();
			expect(row?.lockedUntil).toBeNull();
		});

		it("stringifies a non-Error reason", async () => {
			await seedJob({ lockedBy: ownedBy(repo), lockedUntil: NOW + LOCK_MS });
			await repo.recordFailure("check:mon-1", "weird non-error", NOW);
			const row = await readRow("check:mon-1");
			expect(row?.lastFailReason).toBe("weird non-error");
		});

		it("returns false for an unknown id", async () => {
			expect(await repo.recordFailure("missing", new Error("x"), NOW)).toBe(false);
		});
	});

	// ── upsertEvaluate (handoff + $min coalescing) ───────────────────────────────
	describe("upsertEvaluate", () => {
		it("creates a single evaluate row keyed by monitor", async () => {
			await repo.upsertEvaluate("mon-1", NOW);

			const row = await readRow("evaluate:mon-1");
			expect(row?.type).toBe("evaluate");
			expect(row?.refId).toBe("mon-1");
			expect(row?.nextScheduledAt).toBe(NOW);
			expect(row?.intervalMs).toBeNull();
			expect(row?.isActive).toBe(true);
		});

		it("coalesces rapid checks: a later call never pushes runAt out ($min)", async () => {
			await repo.upsertEvaluate("mon-1", NOW);
			await repo.upsertEvaluate("mon-1", NOW + 9_000);

			const rows = await JobModel.find({ type: "evaluate", refId: "mon-1" }).lean<JobDocument[]>();
			expect(rows).toHaveLength(1);
			expect(rows[0].nextScheduledAt).toBe(NOW); // earliest pending wins
		});

		it("lowers runAt when an earlier evaluation arrives ($min)", async () => {
			await repo.upsertEvaluate("mon-1", NOW + 9_000);
			await repo.upsertEvaluate("mon-1", NOW);

			const row = await readRow("evaluate:mon-1");
			expect(row?.nextScheduledAt).toBe(NOW);
		});

		it("concurrent upserts for one monitor produce exactly one row", async () => {
			const workers = Array.from({ length: 20 }, () => new MongoJobsRepository());
			await Promise.all(workers.map((w) => w.upsertEvaluate("mon-1", NOW)));

			const count = await JobModel.countDocuments({ type: "evaluate", refId: "mon-1" });
			expect(count).toBe(1);
		});
	});

	// ── monitor lifecycle CRUD ───────────────────────────────────────────────────
	describe("CRUD", () => {
		it("upsertJob inserts, then refreshes config without clobbering scheduling state", async () => {
			const job: Job = {
				id: "check:mon-1",
				type: "check",
				refId: "mon-1",
				isActive: true,
				nextScheduledAt: NOW,
				intervalMs: 60_000,
				lockedBy: null,
				lockedUntil: null,
				runCount: 0,
				failCount: 0,
				lastFinishedAt: null,
				lastFailReason: null,
			};
			await repo.upsertJob(job);

			// simulate a running job that has advanced + holds a lease
			await JobModel.updateOne({ _id: "check:mon-1" }, { $set: { nextScheduledAt: NOW + 5_000, lockedBy: "live", runCount: 7 } });

			// a reconcile sweep re-upserts the same id with new config
			await repo.upsertJob({ ...job, intervalMs: 30_000, isActive: false });

			const row = await readRow("check:mon-1");
			expect(row?.intervalMs).toBe(30_000); // config refreshed ($set)
			expect(row?.isActive).toBe(false);
			expect(row?.nextScheduledAt).toBe(NOW + 5_000); // scheduling untouched ($setOnInsert)
			expect(row?.lockedBy).toBe("live");
			expect(row?.runCount).toBe(7);
		});

		it("setActiveById flips check and geo rows together", async () => {
			await seedJob({ _id: "check:mon-1", type: "check" });
			await seedJob({ _id: "geo:mon-1", type: "geo-check" });

			await repo.setActiveById("mon-1", false);

			const rows = await JobModel.find({ refId: "mon-1" }).lean<JobDocument[]>();
			expect(rows).toHaveLength(2);
			expect(rows.every((r) => r.isActive === false)).toBe(true);
		});

		it("updateScheduleById changes the interval on a single typed row", async () => {
			await seedJob({ _id: "check:mon-1", type: "check", intervalMs: 60_000 });
			await seedJob({ _id: "geo:mon-1", type: "geo-check", intervalMs: 60_000 });

			await repo.updateScheduleById("mon-1", "check", 15_000);

			expect((await readRow("check:mon-1"))?.intervalMs).toBe(15_000);
			expect((await readRow("geo:mon-1"))?.intervalMs).toBe(60_000); // untouched
		});

		it("deleteById drops every row for the monitor", async () => {
			await seedJob({ _id: "check:mon-1", type: "check" });
			await seedJob({ _id: "geo:mon-1", type: "geo-check" });
			await repo.upsertEvaluate("mon-1", NOW);

			await repo.deleteById("mon-1");

			expect(await JobModel.countDocuments({ refId: "mon-1" })).toBe(0);
		});

		it("findById returns all of a monitor's rows", async () => {
			await seedJob({ _id: "check:mon-1", type: "check" });
			await seedJob({ _id: "geo:mon-1", type: "geo-check" });

			const jobs = await repo.findById("mon-1");
			expect(jobs.map((j) => j.id).sort()).toEqual(["check:mon-1", "geo:mon-1"]);
		});
	});

	// ── observability ────────────────────────────────────────────────────────────
	describe("observability", () => {
		it("findPage returns a page plus the total count", async () => {
			await seedJob({ _id: "check:a", refId: "a", nextScheduledAt: NOW + 1 });
			await seedJob({ _id: "check:b", refId: "b", nextScheduledAt: NOW + 2 });
			await seedJob({ _id: "check:c", refId: "c", nextScheduledAt: NOW + 3 });

			const { jobs, count } = await repo.findPage({ page: 0, rowsPerPage: 2 });
			expect(count).toBe(3);
			expect(jobs).toHaveLength(2);
			expect(jobs.map((j) => j.id)).toEqual(["check:a", "check:b"]); // sorted by nextScheduledAt
		});

		it("findPage returns everything when rowsPerPage is 0", async () => {
			await seedJob({ _id: "check:a", refId: "a" });
			await seedJob({ _id: "check:b", refId: "b" });

			const { jobs, count } = await repo.findPage({});
			expect(count).toBe(2);
			expect(jobs).toHaveLength(2);
		});

		it("findAll returns every row", async () => {
			await seedJob({ _id: "check:a", refId: "a" });
			await seedJob({ _id: "geo:b", refId: "b", type: "geo-check" });

			expect(await repo.findAll()).toHaveLength(2);
		});
	});
});
