import { describe, expect, it, jest } from "@jest/globals";
import { AppVersionService, isNewerVersion } from "../../../src/domain/app-version/app-version.service.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { Got } from "got";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeRelease = (overrides?: Record<string, unknown>) => ({
	tag_name: "v99.0.0",
	html_url: "https://github.com/bluewave-labs/checkmate/releases/tag/v99.0.0",
	draft: false,
	prerelease: false,
	...overrides,
});

const setup = (getImpl?: () => Promise<unknown>) => {
	const get = jest.fn(getImpl ?? (() => Promise.resolve({ body: makeRelease() })));
	const got = { get } as unknown as Got;
	const service = new AppVersionService(got, createMockLogger());
	return { service, get };
};

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

	it("compares numerically, not lexically", () => {
		// The bug a string comparison introduces: "3.9.0" > "3.10.0" as text.
		expect(isNewerVersion("3.10.0", "3.9.0")).toBe(true);
		expect(isNewerVersion("3.9.0", "3.10.0")).toBe(false);
	});

	it("tolerates a leading v on either side", () => {
		expect(isNewerVersion("v3.14.0", "3.13.1")).toBe(true);
		expect(isNewerVersion("v3.13.1", "v3.13.1")).toBe(false);
	});

	it("returns false for tags that are not plain three-part versions", () => {
		expect(isNewerVersion("v4.0.0-rc.1", "3.13.1")).toBe(false);
		expect(isNewerVersion("2026-10-30", "3.13.1")).toBe(false);
		expect(isNewerVersion("", "3.13.1")).toBe(false);
	});
});

// ── getVersionInfo ───────────────────────────────────────────────────────────

describe("AppVersionService.getVersionInfo", () => {
	it("reports the release url so the client can link to its notes", async () => {
		const { service } = setup();
		const info = await service.getVersionInfo();
		expect(info.latest).toBe("v99.0.0");
		expect(info.updateAvailable).toBe(true);
		expect(info.releaseUrl).toBe("https://github.com/bluewave-labs/checkmate/releases/tag/v99.0.0");
	});

	it("always reports the running version", async () => {
		const { service } = setup();
		const info = await service.getVersionInfo();
		expect(typeof info.current).toBe("string");
		expect(info.current.length).toBeGreaterThan(0);
	});

	it("caches, so repeated calls hit github once", async () => {
		const { service, get } = setup();
		await service.getVersionInfo();
		await service.getVersionInfo();
		await service.getVersionInfo();
		expect(get).toHaveBeenCalledTimes(1);
	});

	it("degrades to current-only when github fails, and caches that too", async () => {
		const { service, get } = setup(() => Promise.reject(new Error("rate limited")));
		const info = await service.getVersionInfo();
		expect(info.latest).toBeNull();
		expect(info.updateAvailable).toBe(false);
		expect(info.releaseUrl).toBeNull();
		await service.getVersionInfo();
		expect(get).toHaveBeenCalledTimes(1);
	});

	it("ignores drafts and prereleases", async () => {
		const draft = setup(() => Promise.resolve({ body: makeRelease({ draft: true }) }));
		expect((await draft.service.getVersionInfo()).latest).toBeNull();

		const prerelease = setup(() => Promise.resolve({ body: makeRelease({ prerelease: true }) }));
		expect((await prerelease.service.getVersionInfo()).latest).toBeNull();
	});

	it("does not flag an update when the published release is not newer", async () => {
		const { service } = setup(() => Promise.resolve({ body: makeRelease({ tag_name: "v0.0.1" }) }));
		const info = await service.getVersionInfo();
		expect(info.latest).toBe("v0.0.1");
		expect(info.updateAvailable).toBe(false);
	});
});
