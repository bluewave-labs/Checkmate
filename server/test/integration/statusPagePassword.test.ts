import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import StatusPageModel from "../../src/db/models/StatusPage.ts";
import StatusPageLockoutModel from "../../src/db/models/StatusPageLockout.ts";
import MongoStatusPagesRepository from "../../src/repositories/status-pages/MongoStatusPagesRepository.ts";
import MongoStatusPageLockoutsRepository from "../../src/repositories/status-page-lockouts/MongoStatusPageLockoutsRepository.ts";
import { StatusPageBruteForceService } from "../../src/service/business/statusPageBruteForceService.ts";
import { StatusPageService } from "../../src/service/business/statusPageService.ts";
import StatusPageController from "../../src/controllers/statusPageController.ts";
import StatusPageRoutes from "../../src/routes/statusPageRoute.ts";
import { createVerifyStatusPageAccess } from "../../src/middleware/verifyStatusPageAccess.ts";
import type { IMonitorsRepository } from "../../src/repositories/index.ts";
import type { ISettingsService } from "../../src/service/system/settingsService.ts";
import { handleErrors } from "../../src/middleware/handleErrors.ts";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = "integration-test-secret";

const stubMonitorsRepo: IMonitorsRepository = {
	findByIds: async () => [],
} as unknown as IMonitorsRepository;

const stubSettings: ISettingsService = {
	serviceName: "settings",
	loadSettings: () => ({ jwtSecret: JWT_SECRET }) as never,
	getSettings: () => ({ jwtSecret: JWT_SECRET }) as never,
	areStatusPageThemesEnabled: () => true,
	getDBSettings: async () => ({ showURL: true }) as never,
	updateDbSettings: async () => ({}) as never,
};

const noopVerifyJWT = (req: Request, _res: Response, next: NextFunction) => {
	const auth = req.headers.authorization;
	if (!auth) {
		return next(new Error("no auth"));
	}
	const token = auth.replace(/^Bearer /, "");
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
		req.user = decoded as Express.Request["user"];
		next();
	} catch (err) {
		next(err);
	}
};

// Production mounts the real authApiLimiter (15 req/min per IP, shared with
// /api/v1/auth/*) on POST /:url/unlock — see server/src/routes/statusPageRoute.ts.
// We stub it out here so the per-page brute-force lockout (10 attempts in a
// 15-minute window, keyed on (statusPageId, ipHash)) can be exercised in
// isolation. The two defenses are layered: authApiLimiter caps IP request
// volume across all auth endpoints; the brute-force lockout produces the
// generic 429 message asserted in the 11-attempts test below.
const noopRateLimiter = (_req: Request, _res: Response, next: NextFunction) => next();

const buildApp = () => {
	const statusPagesRepo = new MongoStatusPagesRepository();
	const lockoutsRepo = new MongoStatusPageLockoutsRepository();
	const bruteForce = new StatusPageBruteForceService(lockoutsRepo);
	const statusPageService = new StatusPageService(statusPagesRepo, stubSettings);
	const controller = new StatusPageController(statusPageService, stubMonitorsRepo, stubSettings, bruteForce);
	const verifyStatusPageAccess = createVerifyStatusPageAccess(statusPagesRepo, noopVerifyJWT, stubSettings);
	const routes = new StatusPageRoutes(controller, noopVerifyJWT, verifyStatusPageAccess, noopRateLimiter);

	const app = express();
	app.use(express.json());
	app.use(cookieParser());
	app.use("/api/v1/status-page", routes.getRouter());
	app.use(handleErrors);
	return app;
};

describe("Status Page Password Protection (integration)", () => {
	let memServer: MongoMemoryServer;
	let app: express.Express;
	let teamId: string;
	let userId: string;

	beforeAll(async () => {
		memServer = await MongoMemoryServer.create();
		await mongoose.connect(memServer.getUri());
		await StatusPageLockoutModel.syncIndexes();
		teamId = new mongoose.Types.ObjectId().toString();
		userId = new mongoose.Types.ObjectId().toString();
		app = buildApp();
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await memServer.stop();
	});

	beforeEach(async () => {
		await StatusPageModel.deleteMany({});
		await StatusPageLockoutModel.deleteMany({});
	});

	const seedProtectedPage = async (password: string) => {
		const hash = bcrypt.hashSync(password, 10);
		return StatusPageModel.create({
			userId: new mongoose.Types.ObjectId(userId),
			teamId: new mongoose.Types.ObjectId(teamId),
			companyName: "Acme",
			url: "acme",
			monitors: [new mongoose.Types.ObjectId()],
			subMonitors: [],
			isPublished: true,
			passwordHash: hash,
			passwordVersion: 1,
		});
	};

	it("GET locked page returns 401 with branding and requiresPassword:true", async () => {
		await seedProtectedPage("supersecret");
		const res = await request(app).get("/api/v1/status-page/acme?type=uptime");
		expect(res.status).toBe(401);
		expect(res.body).toMatchObject({
			requiresPassword: true,
			branding: expect.objectContaining({ companyName: "Acme" }),
		});
		expect(res.body.branding.passwordHash).toBeUndefined();
	});

	it("POST /unlock with correct password sets cookie and GET succeeds", async () => {
		await seedProtectedPage("supersecret");
		const agent = request.agent(app);
		const unlock = await agent.post("/api/v1/status-page/acme/unlock").send({ password: "supersecret" });
		expect(unlock.status).toBe(204);
		expect(unlock.headers["set-cookie"]?.[0]).toContain("checkmate_sp_");
		const get = await agent.get("/api/v1/status-page/acme?type=uptime");
		expect(get.status).toBe(200);
	});

	it("POST /unlock with wrong password returns 401 with requiresPassword:true, no cookie", async () => {
		await seedProtectedPage("supersecret");
		const res = await request(app).post("/api/v1/status-page/acme/unlock").send({ password: "wrong" });
		expect(res.status).toBe(401);
		expect(res.body).toMatchObject({ success: false, requiresPassword: true });
		expect(res.headers["set-cookie"]).toBeUndefined();
	});

	it("11 wrong attempts return 429 with generic message (no digits, no Retry-After)", async () => {
		await seedProtectedPage("supersecret");
		const agent = request.agent(app);
		let lastRes: request.Response | undefined;
		for (let i = 0; i < 11; i++) {
			lastRes = await agent.post("/api/v1/status-page/acme/unlock").send({ password: "wrong" });
		}
		expect(lastRes!.status).toBe(429);
		expect(lastRes!.body.msg).toBe("Too many failed attempts. Please try again later.");
		expect(lastRes!.body.msg).not.toMatch(/\d/);
		expect(lastRes!.headers["retry-after"]).toBeUndefined();
	}, 30_000);

	it("rotating the password invalidates the old cookie", async () => {
		const page = await seedProtectedPage("supersecret");
		const agent = request.agent(app);
		await agent.post("/api/v1/status-page/acme/unlock").send({ password: "supersecret" });
		expect((await agent.get("/api/v1/status-page/acme?type=uptime")).status).toBe(200);

		await StatusPageModel.findByIdAndUpdate(page.id, {
			$inc: { passwordVersion: 1 },
			$set: { passwordHash: bcrypt.hashSync("newpass1", 10) },
		});

		expect((await agent.get("/api/v1/status-page/acme?type=uptime")).status).toBe(401);
	});

	it("admin JWT for the owning team bypasses the password", async () => {
		await seedProtectedPage("supersecret");
		const token = jwt.sign({ id: userId, teamId, role: ["admin"] }, JWT_SECRET, { expiresIn: "1h" });
		const res = await request(app).get("/api/v1/status-page/acme?type=uptime").set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
	});

	it("admin JWT for a different team does NOT bypass", async () => {
		await seedProtectedPage("supersecret");
		const token = jwt.sign({ id: userId, teamId: "other", role: ["admin"] }, JWT_SECRET, { expiresIn: "1h" });
		const res = await request(app).get("/api/v1/status-page/acme?type=uptime").set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(401);
	});

	it("POST /lock clears the cookie", async () => {
		await seedProtectedPage("supersecret");
		const agent = request.agent(app);
		await agent.post("/api/v1/status-page/acme/unlock").send({ password: "supersecret" });
		const lock = await agent.post("/api/v1/status-page/acme/lock");
		expect(lock.status).toBe(204);
		expect(lock.headers["set-cookie"]?.[0]).toMatch(/Expires=Thu, 01 Jan 1970/i);
	});
});
