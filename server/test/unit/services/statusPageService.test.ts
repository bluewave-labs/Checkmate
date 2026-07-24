import { describe, expect, it, jest } from "@jest/globals";
import { StatusPageService } from "../../../src/domain/status-pages/status-page.service.ts";
import type { IStatusPagesRepository } from "../../../src/domain/status-pages/status-page-repository.interface.ts";
import type { ISettingsService } from "../../../src/domain/app-settings/app-settings.service.ts";
import type { IMonitorsRepository } from "../../../src/domain/monitors/monitor.repository.interface.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";
import type { StatusPage } from "../../../src/domain/status-pages/status-page.type.ts";
import { DEFAULT_STATUS_PAGE_THEME, DEFAULT_STATUS_PAGE_THEME_MODE } from "../../../src/domain/status-pages/status-page.type.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeStatusPage = (overrides?: Partial<StatusPage>): StatusPage =>
	({
		id: "sp-1",
		teamId: "team-1",
		userId: "user-1",
		url: "my-status-page",
		companyName: "Test Co",
		monitors: ["mon-1"],
		theme: "modern",
		themeMode: "dark",
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
		...overrides,
	}) as StatusPage;

const createRepo = () =>
	({
		create: jest.fn().mockResolvedValue(makeStatusPage()),
		findByUrl: jest.fn().mockResolvedValue(makeStatusPage()),
		findByCustomDomain: jest.fn().mockResolvedValue(makeStatusPage()),
		findByTeamId: jest.fn().mockResolvedValue([makeStatusPage()]),
		updateById: jest.fn().mockResolvedValue(makeStatusPage()),
		deleteById: jest.fn().mockResolvedValue(makeStatusPage()),
		removeMonitorFromStatusPages: jest.fn().mockResolvedValue(1),
	}) as unknown as jest.Mocked<IStatusPagesRepository>;

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		name: "API Health",
		type: "http",
		status: "up",
		url: "http://internal.example.com/health",
		port: 8080,
		uptimePercentage: 99.9,
		recentChecks: [],
		secret: "super-secret-bearer-token",
		userId: "user-1",
		teamId: "team-1",
		notifications: ["notif-1"],
		jsonPath: "$.status",
		expectedValue: "ok",
		matchMethod: "equal",
		useAdvancedMatching: true,
		customUpCodes: ["200"],
		dnsServer: "10.0.0.53",
		dnsRecordType: "A",
		ignoreTlsErrors: false,
		cpuAlertThreshold: 90,
		memoryAlertThreshold: 90,
		diskAlertThreshold: 90,
		tempAlertThreshold: 90,
		selectedDisks: ["sda"],
		...overrides,
	}) as Monitor;

const createSettingsService = (themesEnabled: boolean, clientHost = "http://localhost:5173", showURL = false) =>
	({
		areStatusPageThemesEnabled: jest.fn().mockReturnValue(themesEnabled),
		getSettings: jest.fn().mockReturnValue({ clientHost }),
		getDBSettings: jest.fn().mockResolvedValue({ showURL }),
	}) as unknown as jest.Mocked<ISettingsService>;

const createMonitorsRepo = () =>
	({
		findByIds: jest.fn().mockResolvedValue([makeMonitor()]),
	}) as unknown as jest.Mocked<IMonitorsRepository>;

const createService = (themesEnabled = true, clientHost = "http://localhost:5173", showURL = false) => {
	const repo = createRepo();
	const settingsService = createSettingsService(themesEnabled, clientHost, showURL);
	const monitorsRepo = createMonitorsRepo();
	const service = new StatusPageService(repo, settingsService, monitorsRepo);
	return { service, repo, settingsService, monitorsRepo };
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("StatusPageService", () => {
	describe("createStatusPage", () => {
		it("delegates to repository with all parameters when themes enabled", async () => {
			const { service, repo } = createService(true);
			const data = { companyName: "New Co" };
			const file = { originalname: "logo.png" } as Express.Multer.File;

			const result = await service.createStatusPage("user-1", "team-1", file, data);

			expect(repo.create).toHaveBeenCalledWith("user-1", "team-1", file, data);
			expect(result).toEqual(makeStatusPage());
		});

		it("passes undefined image when not provided", async () => {
			const { service, repo } = createService(true);

			await service.createStatusPage("user-1", "team-1", undefined, {});

			expect(repo.create).toHaveBeenCalledWith("user-1", "team-1", undefined, {});
		});

		it("strips theme fields from input and applies defaults to result when themes disabled", async () => {
			const { service, repo } = createService(false);
			const data = { companyName: "New Co", theme: "bold" as const, themeMode: "light" as const };

			const result = await service.createStatusPage("user-1", "team-1", undefined, data);

			expect(repo.create).toHaveBeenCalledWith("user-1", "team-1", undefined, { companyName: "New Co" });
			expect(result.theme).toBe(DEFAULT_STATUS_PAGE_THEME);
			expect(result.themeMode).toBe(DEFAULT_STATUS_PAGE_THEME_MODE);
		});
	});

	describe("getStatusPageByUrl", () => {
		it("delegates to repository", async () => {
			const { service, repo } = createService(true);

			const result = await service.getStatusPageByUrl("my-status-page");

			expect(repo.findByUrl).toHaveBeenCalledWith("my-status-page");
			expect(result).toEqual(makeStatusPage());
		});

		it("applies default theme when themes disabled", async () => {
			const { service } = createService(false);

			const result = await service.getStatusPageByUrl("my-status-page");

			expect(result.theme).toBe(DEFAULT_STATUS_PAGE_THEME);
			expect(result.themeMode).toBe(DEFAULT_STATUS_PAGE_THEME_MODE);
		});
	});

	describe("getStatusPageByCustomDomain", () => {
		it("delegates to repository", async () => {
			const { service, repo } = createService(true);

			const result = await service.getStatusPageByCustomDomain("status.example.com");

			expect(repo.findByCustomDomain).toHaveBeenCalledWith("status.example.com");
			expect(result).toEqual(makeStatusPage());
		});
	});

	describe("createStatusPage custom domain validation", () => {
		it("rejects custom domains that match the Checkmate instance host", async () => {
			const { service } = createService(true, "https://checkmate.example.com");

			await expect(
				service.createStatusPage("user-1", "team-1", undefined, {
					customDomain: "checkmate.example.com",
				})
			).rejects.toMatchObject({
				status: 400,
			});
		});

		it("normalizes custom domains before create", async () => {
			const { service, repo } = createService(true);

			await service.createStatusPage("user-1", "team-1", undefined, {
				customDomain: "https://Status.Example.COM",
			});

			expect(repo.create).toHaveBeenCalledWith("user-1", "team-1", undefined, expect.objectContaining({ customDomain: "status.example.com" }));
		});

		it("allows multiple status pages without a custom domain", async () => {
			const { service, repo } = createService(true);

			await service.createStatusPage("user-1", "team-1", undefined, { companyName: "First" });
			await service.createStatusPage("user-1", "team-1", undefined, { companyName: "Second" });

			expect(repo.create).toHaveBeenCalledTimes(2);
		});
	});

	describe("getStatusPagesByTeamId", () => {
		it("delegates to repository", async () => {
			const { service, repo } = createService(true);

			const result = await service.getStatusPagesByTeamId("team-1");

			expect(repo.findByTeamId).toHaveBeenCalledWith("team-1");
			expect(result).toEqual([makeStatusPage()]);
		});

		it("applies default theme to every result when themes disabled", async () => {
			const { service, repo } = createService(false);
			(repo.findByTeamId as jest.Mock).mockResolvedValue([
				makeStatusPage({ id: "sp-1", theme: "bold" }),
				makeStatusPage({ id: "sp-2", theme: "editorial" }),
			]);

			const result = await service.getStatusPagesByTeamId("team-1");

			expect(result).toHaveLength(2);
			for (const sp of result) {
				expect(sp.theme).toBe(DEFAULT_STATUS_PAGE_THEME);
				expect(sp.themeMode).toBe(DEFAULT_STATUS_PAGE_THEME_MODE);
			}
		});
	});

	describe("updateStatusPage", () => {
		it("delegates to repository with all parameters", async () => {
			const { service, repo } = createService(true);
			const updated = makeStatusPage({ companyName: "Updated Co" });
			(repo.updateById as jest.Mock).mockResolvedValue(updated);
			const file = { originalname: "new-logo.png" } as Express.Multer.File;

			const result = await service.updateStatusPage("sp-1", "team-1", file, { companyName: "Updated Co" });

			expect(repo.updateById).toHaveBeenCalledWith("sp-1", "team-1", file, { companyName: "Updated Co" });
			expect(result).toBe(updated);
		});

		it("passes theme and themeMode through to the repository when themes enabled", async () => {
			const { service, repo } = createService(true);
			const patch = { theme: "modern" as const, themeMode: "dark" as const };

			await service.updateStatusPage("sp-1", "team-1", undefined, patch);

			expect(repo.updateById).toHaveBeenCalledWith("sp-1", "team-1", undefined, patch);
		});

		it("strips theme fields from input and applies defaults to result when themes disabled", async () => {
			const { service, repo } = createService(false);
			const patch = { companyName: "Updated Co", theme: "modern" as const, themeMode: "dark" as const };

			const result = await service.updateStatusPage("sp-1", "team-1", undefined, patch);

			expect(repo.updateById).toHaveBeenCalledWith("sp-1", "team-1", undefined, { companyName: "Updated Co" });
			expect(result.theme).toBe(DEFAULT_STATUS_PAGE_THEME);
			expect(result.themeMode).toBe(DEFAULT_STATUS_PAGE_THEME_MODE);
		});
	});

	describe("getPublicStatusPagePayload", () => {
		const SENSITIVE_FIELDS = [
			"secret",
			"userId",
			"teamId",
			"notifications",
			"jsonPath",
			"expectedValue",
			"matchMethod",
			"useAdvancedMatching",
			"customUpCodes",
			"dnsServer",
			"dnsRecordType",
			"ignoreTlsErrors",
			"cpuAlertThreshold",
			"memoryAlertThreshold",
			"diskAlertThreshold",
			"tempAlertThreshold",
			"selectedDisks",
		] as const;

		const publishedPage = () => makeStatusPage({ isPublished: true });

		it("never exposes secret or internal fields — even when showURL is ON (regression)", async () => {
			const { service } = createService(true, "http://localhost:5173", true);

			const { monitors } = await service.getPublicStatusPagePayload(publishedPage(), undefined);

			expect(monitors).toHaveLength(1);
			for (const field of SENSITIVE_FIELDS) {
				expect(monitors[0]).not.toHaveProperty(field);
			}
		});

		it("withholds the same fields when showURL is OFF", async () => {
			const { service } = createService(true, "http://localhost:5173", false);

			const { monitors } = await service.getPublicStatusPagePayload(publishedPage(), undefined);

			for (const field of SENSITIVE_FIELDS) {
				expect(monitors[0]).not.toHaveProperty(field);
			}
		});

		it("includes url/port only when showURL is ON", async () => {
			const withShowURL = createService(true, "http://localhost:5173", true);
			const withoutShowURL = createService(true, "http://localhost:5173", false);

			const shown = await withShowURL.service.getPublicStatusPagePayload(publishedPage(), undefined);
			const hidden = await withoutShowURL.service.getPublicStatusPagePayload(publishedPage(), undefined);

			expect(shown.monitors[0]).toHaveProperty("url", "http://internal.example.com/health");
			expect(shown.monitors[0]).toHaveProperty("port", 8080);
			expect(shown.monitors[0]).not.toHaveProperty("secret");
			expect(hidden.monitors[0]).not.toHaveProperty("url");
			expect(hidden.monitors[0]).not.toHaveProperty("port");
		});

		it("keeps the display fields the public themes consume", async () => {
			const { service } = createService();

			const { monitors } = await service.getPublicStatusPagePayload(publishedPage(), undefined);

			expect(monitors[0]).toMatchObject({
				id: "mon-1",
				name: "API Health",
				type: "http",
				status: "up",
				uptimePercentage: 99.9,
				recentChecks: [],
				checks: [],
			});
		});

		it("orders monitors to match the status page's monitor list", async () => {
			const { service, monitorsRepo } = createService();
			(monitorsRepo.findByIds as jest.Mock).mockResolvedValue([makeMonitor({ id: "mon-1" }), makeMonitor({ id: "mon-2" })]);
			const page = makeStatusPage({ isPublished: true, monitors: ["mon-2", "mon-1"] });

			const { monitors } = await service.getPublicStatusPagePayload(page, undefined);

			expect(monitors.map((monitor) => monitor.id)).toEqual(["mon-2", "mon-1"]);
		});

		it("rejects an unpublished page for a mismatched or absent requester team (403)", async () => {
			const { service } = createService();
			const unpublished = makeStatusPage({ isPublished: false, teamId: "team-A" });

			await expect(service.getPublicStatusPagePayload(unpublished, "team-B")).rejects.toMatchObject({ status: 403 });
			await expect(service.getPublicStatusPagePayload(unpublished, undefined)).rejects.toMatchObject({ status: 403 });
		});

		it("serves an unpublished page to its own team", async () => {
			const { service } = createService();
			const unpublished = makeStatusPage({ isPublished: false, teamId: "team-A" });

			const { monitors } = await service.getPublicStatusPagePayload(unpublished, "team-A");

			expect(monitors).toHaveLength(1);
		});

		it("serves a published page to an anonymous requester", async () => {
			const { service } = createService();

			await expect(service.getPublicStatusPagePayload(publishedPage(), undefined)).resolves.toMatchObject({
				statusPage: expect.objectContaining({ id: "sp-1" }),
			});
		});
	});

	describe("deleteStatusPage", () => {
		it("delegates to repository and returns deleted page", async () => {
			const { service, repo } = createService(true);

			const result = await service.deleteStatusPage("sp-1", "team-1");

			expect(repo.deleteById).toHaveBeenCalledWith("sp-1", "team-1");
			expect(result).toEqual(makeStatusPage());
		});
	});
});
