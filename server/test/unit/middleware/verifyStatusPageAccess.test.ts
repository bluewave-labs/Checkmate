import { describe, expect, it, jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { createVerifyStatusPageAccess } from "../../../src/middleware/verifyStatusPageAccess.ts";
import { buildCookieName, signUnlockToken } from "../../../src/utils/statusPagePasswordCookie.ts";

const SECRET = "test-secret";

const makeStatusPage = (overrides: Record<string, unknown> = {}) => ({
	id: "sp-1",
	teamId: "team-1",
	url: "my-page",
	isPublished: true,
	companyName: "Acme",
	logo: undefined,
	color: "#000",
	theme: "refined",
	themeMode: "auto",
	passwordProtected: false,
	...overrides,
});

const makeRes = () => {
	const status = jest.fn().mockReturnThis();
	const json = jest.fn().mockReturnThis();
	const cookie = jest.fn().mockReturnThis();
	return { status, json, cookie } as unknown as Response;
};

const makeReq = (cookies: Record<string, string> = {}, headers: Record<string, string> = {}, params: Record<string, string> = { url: "my-page" }) =>
	({ cookies, headers, params }) as unknown as Request;

type SecretFields = { passwordHash: string | null; passwordVersion: number };

const makeRepo = (sp: ReturnType<typeof makeStatusPage>, withSecret?: SecretFields) => ({
	findByUrl: jest.fn().mockResolvedValue(sp),
	findByUrlWithSecret: jest.fn().mockResolvedValue({ ...sp, ...(withSecret ?? { passwordHash: null, passwordVersion: 0 }) }),
});

const makeSettings = () => ({
	getSettings: () => ({ jwtSecret: SECRET }),
});

const noopVerifyJWT = (_req: Request, _res: Response, next: NextFunction) => next();
const failingVerifyJWT = (_req: Request, _res: Response, next: NextFunction) => next(new Error("unauthorized"));

describe("verifyStatusPageAccess — password protection branches", () => {
	it("calls next() when page is published and has no password", async () => {
		const sp = makeStatusPage({ passwordProtected: false });
		const repo = makeRepo(sp);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const middleware = createVerifyStatusPageAccess(repo as any, noopVerifyJWT as any, makeSettings() as any);
		const next = jest.fn();
		await middleware(makeReq(), makeRes(), next);
		expect(next).toHaveBeenCalledWith();
	});

	it("returns 401 + lock payload when published, password-protected, and no cookie/JWT", async () => {
		const sp = makeStatusPage({ passwordProtected: true });
		const repo = makeRepo(sp, { passwordHash: "$2a$10$abc", passwordVersion: 1 });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const middleware = createVerifyStatusPageAccess(repo as any, failingVerifyJWT as any, makeSettings() as any);
		const res = makeRes();
		const next = jest.fn();
		await middleware(makeReq(), res, next);
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				success: false,
				requiresPassword: true,
				statusPageId: "sp-1",
				branding: expect.any(Object),
			})
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("calls next() when published, password-protected, and a valid unlock cookie is present", async () => {
		const sp = makeStatusPage({ passwordProtected: true });
		const repo = makeRepo(sp, { passwordHash: "$2a$10$abc", passwordVersion: 1 });
		const token = signUnlockToken({ statusPageId: "sp-1", passwordVersion: 1 }, SECRET);
		const req = makeReq({ [buildCookieName("sp-1")]: token });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const middleware = createVerifyStatusPageAccess(repo as any, failingVerifyJWT as any, makeSettings() as any);
		const next = jest.fn();
		await middleware(req, makeRes(), next);
		expect(next).toHaveBeenCalledWith();
	});

	it("rejects an unlock cookie issued under a stale passwordVersion", async () => {
		const sp = makeStatusPage({ passwordProtected: true });
		const repo = makeRepo(sp, { passwordHash: "$2a$10$abc", passwordVersion: 2 });
		const staleToken = signUnlockToken({ statusPageId: "sp-1", passwordVersion: 1 }, SECRET);
		const req = makeReq({ [buildCookieName("sp-1")]: staleToken });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const middleware = createVerifyStatusPageAccess(repo as any, failingVerifyJWT as any, makeSettings() as any);
		const res = makeRes();
		const next = jest.fn();
		await middleware(req, res, next);
		expect(res.status).toHaveBeenCalledWith(401);
	});

	it("rejects an admin JWT used as an unlock cookie (kind mismatch)", async () => {
		const sp = makeStatusPage({ passwordProtected: true });
		const repo = makeRepo(sp, { passwordHash: "$2a$10$abc", passwordVersion: 1 });
		const adminToken = jwt.sign({ id: "u", role: ["admin"] }, SECRET, { expiresIn: "1h" });
		const req = makeReq({ [buildCookieName("sp-1")]: adminToken });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const middleware = createVerifyStatusPageAccess(repo as any, failingVerifyJWT as any, makeSettings() as any);
		const res = makeRes();
		const next = jest.fn();
		await middleware(req, res, next);
		expect(res.status).toHaveBeenCalledWith(401);
	});

	it("calls next() when a valid admin JWT for the owning team is present", async () => {
		const sp = makeStatusPage({ passwordProtected: true });
		const repo = makeRepo(sp, { passwordHash: "$2a$10$abc", passwordVersion: 1 });
		const adminToken = jwt.sign({ id: "u", teamId: "team-1", role: ["admin"] }, SECRET, { expiresIn: "1h" });
		const req = makeReq({}, { authorization: `Bearer ${adminToken}` });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const middleware = createVerifyStatusPageAccess(repo as any, failingVerifyJWT as any, makeSettings() as any);
		const next = jest.fn();
		await middleware(req, makeRes(), next);
		expect(next).toHaveBeenCalledWith();
	});

	it("calls next() when a superadmin JWT is present (any team)", async () => {
		const sp = makeStatusPage({ passwordProtected: true });
		const repo = makeRepo(sp, { passwordHash: "$2a$10$abc", passwordVersion: 1 });
		const sa = jwt.sign({ id: "u", teamId: "other-team", role: ["superadmin"] }, SECRET, { expiresIn: "1h" });
		const req = makeReq({}, { authorization: `Bearer ${sa}` });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const middleware = createVerifyStatusPageAccess(repo as any, failingVerifyJWT as any, makeSettings() as any);
		const next = jest.fn();
		await middleware(req, makeRes(), next);
		expect(next).toHaveBeenCalledWith();
	});

	it("rejects an admin JWT for a different team (falls through to cookie check)", async () => {
		const sp = makeStatusPage({ passwordProtected: true });
		const repo = makeRepo(sp, { passwordHash: "$2a$10$abc", passwordVersion: 1 });
		const otherTeam = jwt.sign({ id: "u", teamId: "other-team", role: ["admin"] }, SECRET, { expiresIn: "1h" });
		const req = makeReq({}, { authorization: `Bearer ${otherTeam}` });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const middleware = createVerifyStatusPageAccess(repo as any, failingVerifyJWT as any, makeSettings() as any);
		const res = makeRes();
		const next = jest.fn();
		await middleware(req, res, next);
		expect(res.status).toHaveBeenCalledWith(401);
	});

	it("unpublished + owning team JWT → next()", async () => {
		const sp = makeStatusPage({ isPublished: false });
		const repo = makeRepo(sp, { passwordHash: null, passwordVersion: 0 });
		const stubVerifyJWT = (req: Request, _res: Response, next: NextFunction) => {
			(req as Request & { user?: { teamId?: string } }).user = { teamId: "team-1" };
			next();
		};
		const middleware = createVerifyStatusPageAccess(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			repo as any,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			stubVerifyJWT as any,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			makeSettings() as any
		);
		const next = jest.fn();
		await middleware(makeReq(), makeRes(), next);
		expect(next).toHaveBeenCalledWith();
	});

	it("unpublished + different-team JWT → 403 (middleware-level team scoping)", async () => {
		const sp = makeStatusPage({ isPublished: false });
		const repo = makeRepo(sp, { passwordHash: null, passwordVersion: 0 });
		const stubVerifyJWT = (req: Request, _res: Response, next: NextFunction) => {
			(req as Request & { user?: { teamId?: string } }).user = { teamId: "other-team" };
			next();
		};
		const middleware = createVerifyStatusPageAccess(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			repo as any,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			stubVerifyJWT as any,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			makeSettings() as any
		);
		const res = makeRes();
		const next = jest.fn();
		await middleware(makeReq(), res, next);
		expect(res.status).toHaveBeenCalledWith(403);
		expect(next).not.toHaveBeenCalled();
	});
});
