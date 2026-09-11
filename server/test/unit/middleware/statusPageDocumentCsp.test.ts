import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { createStatusPageDocumentCsp } from "../../../src/api/middleware/statusPageDocumentCsp.ts";
import type { IStatusPagesRepository } from "../../../src/domain/status-pages/status-page-repository.interface.ts";
import { makeStatusPage } from "../../helpers/makeStatusPage.ts";

const EMBED_ORIGINS = ["https://a.example", "https://b.example"];

const makeRes = (): Response => {
	const res = {} as Response;
	res.append = jest.fn().mockReturnValue(res) as unknown as Response["append"];
	return res;
};

const createRepo = () =>
	({
		findByUrl: jest.fn().mockResolvedValue(makeStatusPage({ isPublished: true, embedAllowedOrigins: EMBED_ORIGINS })),
		findByCustomDomain: jest
			.fn()
			.mockResolvedValue(makeStatusPage({ isPublished: true, customDomain: "status.example.com", embedAllowedOrigins: EMBED_ORIGINS })),
	}) as unknown as jest.Mocked<Pick<IStatusPagesRepository, "findByUrl" | "findByCustomDomain">>;

type Middleware = ReturnType<typeof createStatusPageDocumentCsp>;

const run = (cspMiddleware: Middleware, req: Partial<Request>): Promise<{ res: Response; next: NextFunction }> =>
	new Promise((resolve) => {
		const res = makeRes();
		const next = jest.fn(() => resolve({ res, next })) as unknown as NextFunction;
		cspMiddleware(req as Request, res, next);
	});

const appendedValue = (res: Response): string => ((res.append as jest.Mock).mock.calls[0] as [string, string])[1];

describe("statusPageDocumentCsp", () => {
	let repo: ReturnType<typeof createRepo>;
	let cspMiddleware: Middleware;

	beforeEach(() => {
		repo = createRepo();
		cspMiddleware = createStatusPageDocumentCsp("http://localhost:10001", repo as unknown as IStatusPagesRepository);
	});

	it("appends a tightened CSP on the public status page path", async () => {
		const { res, next } = await run(cspMiddleware, { path: "/status/public/my-status-page", hostname: "localhost" });

		expect(res.append).toHaveBeenCalledTimes(1);
		const value = appendedValue(res);
		expect(value).toContain("img-src 'self' data:");
		expect(value).toContain("font-src 'self' data: https://fonts.gstatic.com");
		expect(value).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
		expect(next).toHaveBeenCalledTimes(1);
	});

	it("does not restrict default-src or connect-src so the page can still reach the API", async () => {
		const { res } = await run(cspMiddleware, { path: "/status/public/my-status-page", hostname: "localhost" });

		const value = appendedValue(res);
		expect(value).not.toContain("default-src");
		expect(value).not.toContain("connect-src");
	});

	it("allows the configured embedding origins on the public status page path", async () => {
		const { res } = await run(cspMiddleware, { path: "/status/public/my-status-page", hostname: "localhost" });

		expect(appendedValue(res)).toContain("frame-ancestors 'self' https://a.example https://b.example");
		expect(repo.findByUrl).toHaveBeenCalledWith("my-status-page");
		expect(repo.findByCustomDomain).not.toHaveBeenCalled();
	});

	it("appends the CSP with embedding origins on a custom domain document at the host root", async () => {
		const { res, next } = await run(cspMiddleware, { path: "/", hostname: "status.example.com" });

		expect(res.append).toHaveBeenCalledTimes(1);
		const value = appendedValue(res);
		expect(value).toContain("img-src 'self' data:");
		expect(value).toContain("frame-ancestors 'self' https://a.example https://b.example");
		expect(repo.findByCustomDomain).toHaveBeenCalledWith("status.example.com");
		expect(repo.findByUrl).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledTimes(1);
	});

	it("ignores embedding origins on an unpublished status page", async () => {
		repo.findByUrl.mockResolvedValue(makeStatusPage({ isPublished: false, embedAllowedOrigins: EMBED_ORIGINS }));

		const { res } = await run(cspMiddleware, { path: "/status/public/my-status-page", hostname: "localhost" });

		const value = appendedValue(res);
		expect(value).toContain("frame-ancestors 'self'");
		expect(value).not.toContain("https://a.example");
	});

	it("falls back to 'self' when the status page is unknown", async () => {
		repo.findByUrl.mockRejectedValue(new Error("Status page not found"));

		const { res, next } = await run(cspMiddleware, { path: "/status/public/missing-page", hostname: "localhost" });

		const value = appendedValue(res);
		expect(value).toContain("img-src 'self' data:");
		expect(value).toContain("frame-ancestors 'self'");
		expect(value).not.toContain("https://a.example");
		expect(next).toHaveBeenCalledTimes(1);
	});

	it("emits only frame-ancestors 'self' on other documents", async () => {
		const { res, next } = await run(cspMiddleware, { path: "/", hostname: "localhost" });

		expect(res.append).toHaveBeenCalledTimes(1);
		expect(appendedValue(res)).toBe("frame-ancestors 'self'");
		expect(appendedValue(res)).not.toContain("img-src");
		expect(repo.findByUrl).not.toHaveBeenCalled();
		expect(repo.findByCustomDomain).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledTimes(1);
	});

	it("leaves API requests untouched", async () => {
		const { res, next } = await run(cspMiddleware, { path: "/api/v1/monitors", hostname: "localhost" });

		expect(res.append).not.toHaveBeenCalled();
		expect(repo.findByUrl).not.toHaveBeenCalled();
		expect(repo.findByCustomDomain).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledTimes(1);
	});

	it("caches the lookup for a status page url", async () => {
		await run(cspMiddleware, { path: "/status/public/my-status-page", hostname: "localhost" });
		const { res } = await run(cspMiddleware, { path: "/status/public/my-status-page/details", hostname: "localhost" });

		expect(repo.findByUrl).toHaveBeenCalledTimes(1);
		expect(appendedValue(res)).toContain("frame-ancestors 'self' https://a.example https://b.example");
	});
});
