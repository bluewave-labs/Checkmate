import { describe, expect, it, jest } from "@jest/globals";
import { StatusPageService } from "../../../src/service/business/statusPageService.ts";
import type { IStatusPagesRepository } from "../../../src/repositories/status-pages/IStatusPagesRepository.ts";
import type { ISettingsService } from "../../../src/service/system/settingsService.ts";
import type { StatusPage } from "../../../src/types/index.ts";
import { DEFAULT_STATUS_PAGE_THEME, DEFAULT_STATUS_PAGE_THEME_MODE } from "../../../src/types/index.ts";

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
		findByTeamId: jest.fn().mockResolvedValue([makeStatusPage()]),
		updateById: jest.fn().mockResolvedValue(makeStatusPage()),
		deleteById: jest.fn().mockResolvedValue(makeStatusPage()),
		removeMonitorFromStatusPages: jest.fn().mockResolvedValue(1),
	}) as unknown as jest.Mocked<IStatusPagesRepository>;

const createSettingsService = (themesEnabled: boolean) =>
	({
		areStatusPageThemesEnabled: jest.fn().mockReturnValue(themesEnabled),
	}) as unknown as jest.Mocked<ISettingsService>;

const createService = (themesEnabled = true) => {
	const repo = createRepo();
	const settingsService = createSettingsService(themesEnabled);
	const service = new StatusPageService(repo, settingsService);
	return { service, repo, settingsService };
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

	describe("deleteStatusPage", () => {
		it("delegates to repository and returns deleted page", async () => {
			const { service, repo } = createService(true);

			const result = await service.deleteStatusPage("sp-1", "team-1");

			expect(repo.deleteById).toHaveBeenCalledWith("sp-1", "team-1");
			expect(result).toEqual(makeStatusPage());
		});
	});
});
