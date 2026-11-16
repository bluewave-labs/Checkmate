import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { AppVersionService, isNewerVersion } from "../../../src/domain/app-version/app-version.service.ts";
import { APP_VERSION } from "../../../src/utils/appVersion.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { Got } from "got";

// ── Helpers ──────────────────────────────────────────────────────────────────

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

// Far enough from any real version that these hold whatever APP_VERSION is.
const FAR_FUTURE = "v999.0.0";
const FAR_PAST = "v0.0.1";

type Respond = () => Promise<unknown>;

const latestIs =
	(tag: unknown): Respond =>
	() =>
		Promise.resolve({ tag_name: tag });

const setup = (respond: Respond = latestIs(FAR_FUTURE)) => {
	jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00Z"));
	const get = jest.fn(() => ({ json: respond }));
	const service = new AppVersionService({ get } as unknown as Got, createMockLogger());
	return { service, get };
};

afterEach(() => {
	jest.useRealTimers();
});

// ── isNewerVersion ───────────────────────────────────────────────────────────

describe("isNewerVersion", () => {
	it("treats a higher patch, minor or major as newer", () => {
		expect(isNewerVersion("3.13.2", "3.13.1")).toBe(true);
		expect(isNewerVersion("3.14.0", "3.13.1")).toBe(true);
		expect(isNewerVersion("4.0.0", "3.13.1")).toBe(true);
	});

	it("treats an equal or older version as not newer", () => {
		expect(isNewerVersion("3.13.1", "3.13.1")).toBe(false);
		expect(isNewerVersion("3.13.0", "3.13.1")).toBe(false);
		expect(isNewerVersion("2.99.99", "3.13.1")).toBe(false);
	});

	it("compares numerically, not as text", () => {
		// As text, "3.9.0" sorts above "3.10.0".
		expect(isNewerVersion("3.10.0", "3.9.0")).toBe(true);
		expect(isNewerVersion("3.9.0", "3.10.0")).toBe(false);
	});

	it("tolerates a leading v on either side", () => {
		expect(isNewerVersion("v3.14.0", "3.13.1")).toBe(true);
		expect(isNewerVersion("v3.13.1", "v3.13.1")).toBe(false);
	});

	it("returns false when either side is not a plain three-part version", () => {
		expect(isNewerVersion("v4.0.0-rc.1", "3.13.1")).toBe(false);
		expect(isNewerVersion("2026-10-30", "3.13.1")).toBe(false);
		expect(isNewerVersion("", "3.13.1")).toBe(false);
		expect(isNewerVersion("4.0.0", "unknown")).toBe(false);
	});

	it("returns false when latest is null", () => {
		expect(isNewerVersion(null, "3.13.1")).toBe(false);
	});

	it("compares against the running version by default", () => {
		expect(isNewerVersion(FAR_FUTURE)).toBe(true);
		expect(isNewerVersion(`v${APP_VERSION}`)).toBe(false);
	});
});

// ── Fetching ─────────────────────────────────────────────────────────────────

describe("AppVersionService.getVersionInfo — fetching", () => {
	it("requests the latest release with a user-agent and no retries", async () => {
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

	it("reports the latest tag and whether it is newer than the running version", async () => {
		const newer = setup(latestIs(FAR_FUTURE));
		expect(await newer.service.getVersionInfo()).toEqual({ latest: FAR_FUTURE, updateAvailable: true });

		const older = setup(latestIs(FAR_PAST));
		expect(await older.service.getVersionInfo()).toEqual({ latest: FAR_PAST, updateAvailable: false });
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
		resolve({ tag_name: FAR_FUTURE });
		const results = await Promise.all(calls);
		expect(get).toHaveBeenCalledTimes(1);
		expect(results.every((r) => r.latest === FAR_FUTURE)).toBe(true);
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
