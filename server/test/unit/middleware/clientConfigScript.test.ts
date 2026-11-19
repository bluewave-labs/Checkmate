import { describe, expect, it, jest } from "@jest/globals";
import type { Request, Response } from "express";
import { createClientConfigScript } from "../../../src/api/middleware/clientConfigScript.ts";

const CONFIG = { apiBaseUrl: "https://api.example.com/api/v1", clientHost: "https://checkmate.example.com", logLevel: "warn" as const };

const run = (config: Parameters<typeof createClientConfigScript>[0], headers: Record<string, string> = {}) => {
	const res = {} as Response;
	res.set = jest.fn().mockReturnValue(res) as unknown as Response["set"];
	res.type = jest.fn().mockReturnValue(res) as unknown as Response["type"];
	res.send = jest.fn().mockReturnValue(res) as unknown as Response["send"];
	const req = { get: (name: string) => headers[name.toLowerCase()] } as unknown as Request;
	createClientConfigScript(config)(req, res);
	return { res, body: (res.send as jest.Mock).mock.calls[0]?.[0] as string };
};

const configIn = (body: string): Record<string, unknown> => JSON.parse(body.replace("window.__CHECKMATE_CONFIG__ = ", "").replace(/;$/, ""));

describe("clientConfigScript", () => {
	it("serves the full client config as uncached JavaScript", () => {
		const { res, body } = run(CONFIG);

		expect(res.set).toHaveBeenCalledWith("Cache-Control", "no-cache");
		expect(res.type).toHaveBeenCalledWith("application/javascript");
		expect(configIn(body)).toEqual(CONFIG);
	});

	it("leaves out clientHost for a request through the Connect tunnel", () => {
		const { body } = run(CONFIG, { "x-checkmate-connect-tunnel": "1" });

		expect(configIn(body)).toEqual({ apiBaseUrl: CONFIG.apiBaseUrl, logLevel: CONFIG.logLevel });
	});

	it("serves an empty config when nothing is set", () => {
		const { body } = run({});

		expect(body).toBe("window.__CHECKMATE_CONFIG__ = {};");
	});

	it("escapes < so a value can't close the script", () => {
		const { body } = run({ apiBaseUrl: "</script><script>alert(1)</script>" });

		expect(body).not.toContain("</script>");
		expect(body).toContain("\\u003c/script>");
	});
});
