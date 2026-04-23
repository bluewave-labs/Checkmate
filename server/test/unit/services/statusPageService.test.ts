import { describe, expect, it, jest } from "@jest/globals";
import { StatusPageService } from "../../../src/service/business/statusPageService.ts";
import type { IStatusPagesRepository } from "../../../src/repositories/status-pages/IStatusPagesRepository.ts";
import type { StatusPage } from "../../../src/types/index.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeStatusPage = (overrides?: Partial<StatusPage>): StatusPage =>
	({
		id: "sp-1",
		teamId: "team-1",
		userId: "user-1",
		url: "my-status-page",
		companyName: "Test Co",
		monitors: ["mon-1"],
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

const createService = () => {
	const repo = createRepo();
	const service = new StatusPageService(repo);
	return { service, repo };
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("StatusPageService", () => {
	describe("createStatusPage", () => {
		it("delegates to repository with all parameters", async () => {
			const { service, repo } = createService();
			const data = { companyName: "New Co" };
			const file = { originalname: "logo.png" } as Express.Multer.File;

			const result = await service.createStatusPage("user-1", "team-1", file, data);

			expect(repo.create).toHaveBeenCalledWith("user-1", "team-1", file, data);
			expect(result).toEqual(makeStatusPage());
		});

		it("passes undefined image when not provided", async () => {
			const { service, repo } = createService();

			await service.createStatusPage("user-1", "team-1", undefined, {});

			expect(repo.create).toHaveBeenCalledWith("user-1", "team-1", undefined, {});
		});
	});

	describe("getStatusPageByUrl", () => {
		it("delegates to repository", async () => {
			const { service, repo } = createService();

			const result = await service.getStatusPageByUrl("my-status-page");

			expect(repo.findByUrl).toHaveBeenCalledWith("my-status-page");
			expect(result).toEqual(makeStatusPage());
		});
	});

	describe("getStatusPagesByTeamId", () => {
		it("delegates to repository", async () => {
			const { service, repo } = createService();

			const result = await service.getStatusPagesByTeamId("team-1");

			expect(repo.findByTeamId).toHaveBeenCalledWith("team-1");
			expect(result).toEqual([makeStatusPage()]);
		});
	});

	describe("updateStatusPage", () => {
		it("delegates to repository with all parameters", async () => {
			const { service, repo } = createService();
			const updated = makeStatusPage({ companyName: "Updated Co" });
			(repo.updateById as jest.Mock).mockResolvedValue(updated);
			const file = { originalname: "new-logo.png" } as Express.Multer.File;

			const result = await service.updateStatusPage("sp-1", "team-1", file, { companyName: "Updated Co" });

			expect(repo.updateById).toHaveBeenCalledWith("sp-1", "team-1", file, { companyName: "Updated Co" });
			expect(result).toBe(updated);
		});

		it("passes theme and themeMode through to the repository", async () => {
			const { service, repo } = createService();
			const patch = { theme: "modern" as const, themeMode: "dark" as const };

			await service.updateStatusPage("sp-1", "team-1", undefined, patch);

			expect(repo.updateById).toHaveBeenCalledWith("sp-1", "team-1", undefined, patch);
		});
	});

	describe("deleteStatusPage", () => {
		it("delegates to repository and returns deleted page", async () => {
			const { service, repo } = createService();

			const result = await service.deleteStatusPage("sp-1", "team-1");

			expect(repo.deleteById).toHaveBeenCalledWith("sp-1", "team-1");
			expect(result).toEqual(makeStatusPage());
		});
	});
});
