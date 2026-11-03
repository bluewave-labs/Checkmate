import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { AppVersionService } from "../../../src/domain/app-version/app-version.service.ts";
import { APP_VERSION } from "../../../src/utils/appVersion.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { Got } from "got";

// ── Helpers ──────────────────────────────────────────────────────────────────

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

// Tags are built relative to the running version so the tests survive version bumps.
const [MAJOR, MINOR, PATCH] = APP_VERSION.split(".").map(Number) as [number, number, number];
const version = (major: number, minor: number, patch: number) => `v${major}.${minor}.${patch}`;

type Respond = () => Promise<unknown>;

const setup = (respond: Respond = () => Promise.resolve({ tag_name: version(MAJOR + 1, 0, 0) })) => {
	jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00Z"));
	const get = jest.fn(() => ({ json: respond }));
	const service = new AppVersionService({ get } as unknown as Got, createMockLogger());
	return { service, get };
};

const latestIs =
	(tag: unknown): Respond =>
	() =>
		Promise.resolve({ tag_name: tag });

afterEach(() => {
	jest.useRealTimers();
});

// ── Version comparison ───────────────────────────────────────────────────────

describe("AppVersionService.getVersionInfo — comparison", () => {
	it("flags a newer patch, minor or major", async () => {
		for (const tag of [version(MAJOR, MINOR, PATCH + 1), version(MAJOR, MINOR + 1, 0), version(MAJOR + 1, 0, 0)]) {
			const { service } = setup(latestIs(tag));
			expect(await service.getVersionInfo()).toEqual({ latest: tag, updateAvailable: true });
		}
	});

	it("does not flag the same version", async () => {
		const { service } = setup(latestIs(`v${APP_VERSION}`));
		expect((await service.getVersionInfo()).updateAvailable).toBe(false);
	});

	it("does not flag an older release, e.g. when running a develop build ahead of it", async () => {
		const { service } = setup(latestIs(version(MAJOR - 1, 99, 99)));
		expect((await service.getVersionInfo()).updateAvailable).toBe(false);
	});

	it("compares numerically, not as text", async () => {
		// A minor of 1 followed by zeros, one digit longer than the current minor: numerically higher,
		// but lower as text (e.g. 13 → 100, and "100" < "13"), so a string comparison would miss it.
		const textuallyLowerMinor = Number(`1${"0".repeat(String(MINOR).length)}`);
		const { service } = setup(latestIs(version(MAJOR, textuallyLowerMinor, 0)));
		expect((await service.getVersionInfo()).updateAvailable).toBe(true);
	});

	it("accepts a tag without the leading v", async () => {
		const { service } = setup(latestIs(`${MAJOR + 1}.0.0`));
		expect((await service.getVersionInfo()).updateAvailable).toBe(true);
	});

	it("never flags a tag that is not a plain three-part version", async () => {
		for (const tag of [`v${MAJOR + 1}.0.0-rc.1`, "2026-10-30", ""]) {
			const { service } = setup(latestIs(tag));
			expect((await service.getVersionInfo()).updateAvailable).toBe(false);
		}
	});
});

// ── Fetching ─────────────────────────────────────────────────────────────────

describe("AppVersionService.getVersionInfo — fetching", () => {
	it("sends a user-agent and does not retry", async () => {
		const { service, get } = setup();
		await service.getVersionInfo();
		expect(get).toHaveBeenCalledWith(
			"https://api.github.com/repos/bluewave-labs/checkmate/releases/latest",
			expect.objectContaining({
				retry: { limit: 0 },
				headers: expect.objectContaining({ "user-agent": `Checkmate/${APP_VERSION}` }),
			})
		);
	});

	it("returns latest null and no update when the request fails", async () => {
		const { service } = setup(() => Promise.reject(new Error("rate limited")));
		expect(await service.getVersionInfo()).toEqual({ latest: null, updateAvailable: false });
	});

	it("returns latest null when the response has no string tag_name", async () => {
		const { service } = setup(latestIs(undefined));
		expect(await service.getVersionInfo()).toEqual({ latest: null, updateAvailable: false });
	});
});

// ── Caching ──────────────────────────────────────────────────────────────────

describe("AppVersionService.getVersionInfo — caching", () => {
	it("serves repeat calls from the cache", async () => {
		const { service, get } = setup();
		await service.getVersionInfo();
		await service.getVersionInfo();
		await service.getVersionInfo();
		expect(get).toHaveBeenCalledTimes(1);
	});

	it("shares one request between concurrent callers", async () => {
		let resolve!: (body: unknown) => void;
		const { service, get } = setup(() => new Promise((r) => (resolve = r)));
		const calls = [service.getVersionInfo(), service.getVersionInfo(), service.getVersionInfo()];
		resolve({ tag_name: version(MAJOR + 1, 0, 0) });
		const results = await Promise.all(calls);
		expect(get).toHaveBeenCalledTimes(1);
		expect(new Set(results.map((r) => r.latest))).toEqual(new Set([version(MAJOR + 1, 0, 0)]));
	});

	it("refetches after six hours on success", async () => {
		const { service, get } = setup();
		await service.getVersionInfo();
		jest.setSystemTime(Date.now() + SIX_HOURS_MS - 1);
		await service.getVersionInfo();
		expect(get).toHaveBeenCalledTimes(1);
		jest.setSystemTime(Date.now() + 1);
		await service.getVersionInfo();
		expect(get).toHaveBeenCalledTimes(2);
	});

	it("retries after ten minutes on failure, not six hours", async () => {
		const { service, get } = setup(() => Promise.reject(new Error("offline")));
		await service.getVersionInfo();
		jest.setSystemTime(Date.now() + TEN_MINUTES_MS - 1);
		await service.getVersionInfo();
		expect(get).toHaveBeenCalledTimes(1);
		jest.setSystemTime(Date.now() + 1);
		await service.getVersionInfo();
		expect(get).toHaveBeenCalledTimes(2);
	});
});
