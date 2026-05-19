import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import MongoStatusPageLockoutsRepository from "../../../src/repositories/status-page-lockouts/MongoStatusPageLockoutsRepository.ts";
import StatusPageLockoutModel from "../../../src/db/models/StatusPageLockout.ts";

describe("MongoStatusPageLockoutsRepository", () => {
	let memServer: MongoMemoryServer;
	const WINDOW_MS = 15 * 60 * 1000;
	const pageId = new mongoose.Types.ObjectId().toString();
	const ipHash = "sha256-of-ip";

	beforeEach(async () => {
		memServer = await MongoMemoryServer.create();
		await mongoose.connect(memServer.getUri());
		await StatusPageLockoutModel.syncIndexes();
	});

	afterEach(async () => {
		await mongoose.disconnect();
		await memServer.stop();
	});

	it("recordFailure creates a doc with attempts=1 on first call", async () => {
		const repo = new MongoStatusPageLockoutsRepository();
		const state = await repo.recordFailure(pageId, ipHash, WINDOW_MS);
		expect(state.attempts).toBe(1);
		expect(state.lockedUntil).toBeInstanceOf(Date);
	});

	it("recordFailure increments attempts on subsequent calls", async () => {
		const repo = new MongoStatusPageLockoutsRepository();
		await repo.recordFailure(pageId, ipHash, WINDOW_MS);
		await repo.recordFailure(pageId, ipHash, WINDOW_MS);
		const state = await repo.recordFailure(pageId, ipHash, WINDOW_MS);
		expect(state.attempts).toBe(3);
	});

	it("getState returns attempts=0 when no doc exists", async () => {
		const repo = new MongoStatusPageLockoutsRepository();
		const state = await repo.getState(pageId, ipHash);
		expect(state.attempts).toBe(0);
		expect(state.lockedUntil).toBeNull();
	});

	it("getState returns the recorded attempts", async () => {
		const repo = new MongoStatusPageLockoutsRepository();
		await repo.recordFailure(pageId, ipHash, WINDOW_MS);
		await repo.recordFailure(pageId, ipHash, WINDOW_MS);
		const state = await repo.getState(pageId, ipHash);
		expect(state.attempts).toBe(2);
	});

	it("clear deletes the doc", async () => {
		const repo = new MongoStatusPageLockoutsRepository();
		await repo.recordFailure(pageId, ipHash, WINDOW_MS);
		await repo.clear(pageId, ipHash);
		const state = await repo.getState(pageId, ipHash);
		expect(state.attempts).toBe(0);
	});

	it("recordFailure does NOT push expiresAt forward within an active window", async () => {
		const repo = new MongoStatusPageLockoutsRepository();
		const first = await repo.recordFailure(pageId, ipHash, WINDOW_MS);
		await new Promise((r) => setTimeout(r, 25));
		const second = await repo.recordFailure(pageId, ipHash, WINDOW_MS);
		expect(second.attempts).toBe(2);
		expect(second.lockedUntil!.getTime()).toBe(first.lockedUntil!.getTime());
	});

	it("recordFailure resets attempts to 1 after the window expires", async () => {
		const repo = new MongoStatusPageLockoutsRepository();
		const SHORT_WINDOW = 50;
		await repo.recordFailure(pageId, ipHash, SHORT_WINDOW);
		await repo.recordFailure(pageId, ipHash, SHORT_WINDOW);
		const before = await repo.getState(pageId, ipHash);
		expect(before.attempts).toBe(2);
		await new Promise((r) => setTimeout(r, SHORT_WINDOW + 25));
		const after = await repo.recordFailure(pageId, ipHash, SHORT_WINDOW);
		expect(after.attempts).toBe(1);
		expect(after.lockedUntil!.getTime()).toBeGreaterThan(before.lockedUntil!.getTime());
	});
});
