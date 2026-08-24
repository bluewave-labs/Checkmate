import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import express from "express";
import helmet from "helmet";
import fs from "fs";
import os from "os";
import path from "path";
import type { Server } from "http";
import { APP_CSP_DIRECTIVES } from "../../../src/api/middleware/appCsp.ts";

const directive = (name: string): string[] => (APP_CSP_DIRECTIVES as Record<string, string[]>)[name] ?? [];

describe("APP_CSP_DIRECTIVES", () => {
	it("allows blob: images so an upload preview renders", () => {
		expect(directive("img-src")).toContain("blob:");
	});

	it("allows blob: connections so the upload can read the picked file back", () => {
		// Without an explicit connect-src the XHR falls back to default-src 'self',
		// which does not cover blob:, and the logo is dropped on submit.
		expect(directive("connect-src")).toContain("blob:");
	});

	it("keeps blob: out of script-src", () => {
		expect(directive("script-src")).not.toContain("blob:");
	});
});

// express.static ends a request without calling next(), so a header registered
// after it never reaches index.html. These assert the emitted header rather than
// the directive object, which is what catches that ordering mistake.
describe("app CSP header delivery", () => {
	let server: Server;
	let baseUrl: string;
	let frontendPath: string;

	beforeAll(async () => {
		frontendPath = fs.mkdtempSync(path.join(os.tmpdir(), "checkmate-csp-"));
		fs.writeFileSync(path.join(frontendPath, "index.html"), "<html></html>");
		fs.writeFileSync(path.join(frontendPath, "asset.js"), "// built asset");

		const app = express();
		app.use(helmet({ hsts: false, contentSecurityPolicy: { useDefaults: true, directives: { ...APP_CSP_DIRECTIVES } } }));
		app.use(express.static(frontendPath));
		app.get("*", (_req, res) => res.sendFile(path.join(frontendPath, "index.html")));

		await new Promise<void>((resolve) => {
			server = app.listen(0, () => {
				const address = server.address();
				baseUrl = `http://localhost:${typeof address === "object" && address !== null ? address.port : 0}`;
				resolve();
			});
		});
	});

	afterAll(async () => {
		fs.rmSync(frontendPath, { recursive: true, force: true });
		await new Promise<void>((resolve) => server.close(() => resolve()));
	});

	const cspFor = async (routePath: string): Promise<string> => {
		const res = await fetch(`${baseUrl}${routePath}`);
		return res.headers.get("content-security-policy") ?? "";
	};

	it("sets the CSP on the statically served app document", async () => {
		expect(await cspFor("/")).toContain("blob:");
	});

	it("sets the CSP on built assets", async () => {
		expect(await cspFor("/asset.js")).toContain("blob:");
	});

	it("sets the CSP on the SPA fallback route", async () => {
		expect(await cspFor("/status/create")).toContain("blob:");
	});

	it("allows blob: for images and connections but never for scripts", async () => {
		const csp = await cspFor("/");

		expect(csp).toMatch(/img-src[^;]*blob:/);
		expect(csp).toMatch(/connect-src[^;]*blob:/);
		expect(csp).not.toMatch(/script-src[^;]*blob:/);
	});
});
