import { describe, expect, it, jest } from "@jest/globals";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import type { Options } from "express-rate-limit";
import type { AddressInfo } from "node:net";
import {
	heartbeatApiLimiter,
	heartbeatCreateLimiter,
	heartbeatCreateRateLimitKey,
	heartbeatRateLimitKey,
	tooManyRequests,
} from "../../../src/api/middleware/rateLimiter.ts";
import { HEARTBEAT_CREATE_LIMIT_PER_HOUR } from "../../../src/domain/heartbeat/heartbeat.type.ts";

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
	it("keys a heartbeat request by ping key and slug", () => {
		expect(heartbeatRateLimitKey({ path: "/key-a/backup", ip: "1.2.3.4" } as Request)).toBe("key-a/backup");
		expect(heartbeatRateLimitKey({ path: "/key-a/backup/fail", ip: "1.2.3.4" } as Request)).toBe("key-a/backup");
		expect(heartbeatRateLimitKey({ path: "/key-a/backup/1", ip: "1.2.3.4" } as Request)).toBe("key-a/backup");
	});

	it("gives each slug under one key its own bucket", () => {
		expect(heartbeatRateLimitKey({ path: "/key-a/backup", ip: "1.2.3.4" } as Request)).not.toBe(
			heartbeatRateLimitKey({ path: "/key-a/vacuum", ip: "1.2.3.4" } as Request)
		);
	});

	it("falls back to the client IP when the path has no key and slug", () => {
		expect(heartbeatRateLimitKey({ path: "/", ip: "1.2.3.4" } as Request)).toBe("1.2.3.4");
		expect(heartbeatRateLimitKey({ path: "/key-a", ip: "1.2.3.4" } as Request)).toBe("1.2.3.4");
	});

	it("limits one monitor to 60 a minute without touching other slugs or keys", async () => {
		const { ping, close } = await setupHeartbeatApp();
		try {
			for (let i = 0; i < 60; i++) expect(await ping("/key-limit/backup")).toBe(200);
			expect(await ping("/key-limit/backup/1")).toBe(429); // sub-paths share the monitor's budget
			expect(await ping("/key-limit/vacuum")).toBe(200); // another slug under the same key
			expect(await ping("/key-other/backup")).toBe(200); // the same slug under another key
		} finally {
			await close();
		}
	});
});

const setupCreateApp = async () => {
	const app = express();
	app.use("/api/v1/heartbeat", heartbeatCreateLimiter, (_req, res) => {
		res.json({ ok: true });
	});
	const server = app.listen(0);
	await new Promise((resolve) => server.once("listening", resolve));
	const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1/heartbeat`;
	const ping = async (path: string) => (await fetch(`${base}${path}`)).status;
	const close = () => new Promise((resolve) => server.close(resolve));
	return { ping, close };
};

describe("heartbeatCreateLimiter", () => {
	it("keys a create request by the ping key alone", () => {
		expect(heartbeatCreateRateLimitKey({ path: "/key-a/backup", ip: "1.2.3.4" } as Request)).toBe("key-a");
		expect(heartbeatCreateRateLimitKey({ path: "/key-a/vacuum/fail", ip: "1.2.3.4" } as Request)).toBe("key-a");
	});

	it("falls back to the client IP when the path has no key", () => {
		expect(heartbeatCreateRateLimitKey({ path: "/", ip: "1.2.3.4" } as Request)).toBe("1.2.3.4");
	});

	it("caps create=true requests per key across slugs, and leaves other requests alone", async () => {
		const { ping, close } = await setupCreateApp();
		try {
			for (let i = 0; i < HEARTBEAT_CREATE_LIMIT_PER_HOUR; i++) expect(await ping(`/key-create/slug-${i}?create=true`)).toBe(200);
			expect(await ping("/key-create/one-more?create=true")).toBe(429);
			expect(await ping("/key-create/one-more")).toBe(200);
			expect(await ping("/key-create/one-more?create=false")).toBe(200);
			expect(await ping("/key-create-other/one-more?create=true")).toBe(200);
		} finally {
			await close();
		}
	});
});
