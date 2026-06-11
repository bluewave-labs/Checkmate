import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { createStatusPageCorsOrigin } from "../../../src/api/middleware/statusPageCorsOrigin.ts";
import type { IStatusPagesRepository } from "../../../src/domain/status-pages/status-page-repository.interface.ts";
import type { StatusPage } from "../../../src/domain/status-pages/status-page.type.ts";

const makeStatusPage = (overrides?: Partial<StatusPage>): StatusPage =>
	({
		id: "sp-1",
		isPublished: true,
		customDomain: "status.example.com",
		...overrides,
	}) as StatusPage;

const createRepo = () =>
	({
		findByCustomDomain: jest.fn().mockResolvedValue(makeStatusPage()),
	}) as unknown as jest.Mocked<Pick<IStatusPagesRepository, "findByCustomDomain">>;

const invokeOrigin = (originFn: ReturnType<typeof createStatusPageCorsOrigin>, origin: string): Promise<boolean | string> =>
	new Promise((resolve, reject) => {
		originFn?.(origin, (error, result) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(result ?? false);
		});
	});

describe("createStatusPageCorsOrigin", () => {
	let repo: jest.Mocked<Pick<IStatusPagesRepository, "findByCustomDomain">>;

	beforeEach(() => {
		repo = createRepo();
	});

	it("allows the configured client host without a repository lookup", async () => {
		const originFn = createStatusPageCorsOrigin("https://checkmate.example.com", repo as IStatusPagesRepository);

		await expect(invokeOrigin(originFn, "https://checkmate.example.com")).resolves.toBe(true);
		expect(repo.findByCustomDomain).not.toHaveBeenCalled();
	});

	it("caches published custom domain lookups", async () => {
		const originFn = createStatusPageCorsOrigin("https://checkmate.example.com", repo as IStatusPagesRepository);

		await expect(invokeOrigin(originFn, "https://status.example.com")).resolves.toBe("https://status.example.com");
		await expect(invokeOrigin(originFn, "https://status.example.com")).resolves.toBe("https://status.example.com");

		expect(repo.findByCustomDomain).toHaveBeenCalledTimes(1);
		expect(repo.findByCustomDomain).toHaveBeenCalledWith("status.example.com");
	});

	it("rejects unpublished custom domains", async () => {
		repo.findByCustomDomain.mockResolvedValue(makeStatusPage({ isPublished: false }));
		const originFn = createStatusPageCorsOrigin("https://checkmate.example.com", repo as IStatusPagesRepository);

		await expect(invokeOrigin(originFn, "https://status.example.com")).resolves.toBe(false);
	});
});
