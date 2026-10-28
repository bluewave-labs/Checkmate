import { describe, expect, it, jest } from "@jest/globals";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import type { Options } from "express-rate-limit";
import type { AddressInfo } from "node:net";
import { heartbeatApiLimiter, heartbeatRateLimitKey, tooManyRequests } from "../../../src/api/middleware/rateLimiter.ts";

const makeRes = (): Response => {
	const res = {} as Response;
	res.status = jest.fn().mockReturnValue(res) as unknown as Response["status"];
	res.json = jest.fn().mockReturnValue(res) as unknown as Response["json"];
	return res;
};

describe("rateLimiter", () => {
	it("answers a rate-limited request with a 429 in the error envelope", () => {
		const res = makeRes();
		tooManyRequests({} as Request, res, (() => {}) as NextFunction, {} as Options);
		expect(res.status).toHaveBeenCalledWith(429);
		expect(res.json).toHaveBeenCalledWith({ status: 429, msg: "Too many requests, please try again later." });
	});
});

// The limiter's store lives for the whole module, so each test uses its own tokens
const setupHeartbeatApp = async () => {
	const app = express();
	app.use("/api/v1/heartbeat", heartbeatApiLimiter, (_req, res) => {
		res.json({ ok: true });
	});
	const server = app.listen(0);
	await new Promise((resolve) => server.once("listening", resolve));
	const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1/heartbeat`;
	const ping = async (path: string) => (await fetch(`${base}${path}`, { method: "POST" })).status;
	const close = () => new Promise((resolve) => server.close(resolve));
	return { ping, close };
};

describe("heartbeatApiLimiter", () => {
	it("keys a heartbeat request by the token segment", () => {
		expect(heartbeatRateLimitKey({ path: "/tok-a/fail", ip: "1.2.3.4" } as Request)).toBe("tok-a");
		expect(heartbeatRateLimitKey({ path: "/tok-a", ip: "1.2.3.4" } as Request)).toBe("tok-a");
	});

	it("falls back to the client IP when the path has no token", () => {
		expect(heartbeatRateLimitKey({ path: "/", ip: "1.2.3.4" } as Request)).toBe("1.2.3.4");
	});

	it("limits one token to 60 a minute without touching another token", async () => {
		const { ping, close } = await setupHeartbeatApp();
		try {
			for (let i = 0; i < 60; i++) expect(await ping("/tok-limit")).toBe(200);
			expect(await ping("/tok-limit/1")).toBe(429); // sub-paths share the token's budget
			expect(await ping("/tok-other")).toBe(200);
		} finally {
			await close();
		}
	});
});
