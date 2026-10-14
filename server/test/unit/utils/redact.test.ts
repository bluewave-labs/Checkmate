import { describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { redact, redactError, redactRecord, redactString } from "../../../src/utils/redact.ts";

describe("redactString", () => {
	it.each([
		["Slack", "https://hooks.slack.com/services/T000/B000/XXXX", "https://hooks.slack.com/services/[REDACTED]"],
		["Discord", "https://discord.com/api/webhooks/123/abc-def", "https://discord.com/api/webhooks/[REDACTED]"],
		["legacy Discord", "https://discordapp.com/api/webhooks/123/abc", "https://discordapp.com/api/webhooks/[REDACTED]"],
		["Teams", "https://example.webhook.office.com/webhookb2/abc/IncomingWebhook/def", "https://example.webhook.office.com/[REDACTED]"],
		["Telegram", "https://api.telegram.org/bot123456:ABC-DEF/sendMessage", "https://api.telegram.org/bot[REDACTED]/sendMessage"],
	])("masks the secret path of a %s URL", (_name, input, expected) => {
		expect(redactString(`POST ${input} failed`)).toBe(`POST ${expected} failed`);
	});

	it("masks credentials in a URL", () => {
		expect(redactString("connect mongodb://admin:hunter2@db:27017/uptime")).toBe("connect mongodb://[REDACTED]@db:27017/uptime");
	});

	it.each([
		["an empty username", "redis://:s3cret@cache:6379", "redis://[REDACTED]@cache:6379"],
		["an @ in the password", "mongodb://admin:p@ss@db:27017/uptime", "mongodb://[REDACTED]@db:27017/uptime"],
		["a token with no password", "https://ghp_abc123@github.com/org/repo.git", "https://[REDACTED]@github.com/org/repo.git"],
	])("masks URL credentials with %s", (_name, input, expected) => {
		expect(redactString(`failed ${input}`)).toBe(`failed ${expected}`);
	});

	it("leaves an @ in a URL path alone", () => {
		const text = "GET https://medium.com/@someone/post returned 404";
		expect(redactString(text)).toBe(text);
	});

	it("masks every occurrence", () => {
		const url = "https://hooks.slack.com/services/T/B/X";
		expect(redactString(`${url} and ${url}`)).toBe("https://hooks.slack.com/services/[REDACTED] and https://hooks.slack.com/services/[REDACTED]");
	});

	it("leaves text without secrets unchanged", () => {
		const text = "GET https://example.com/status 503 after 1200ms";
		expect(redactString(text)).toBe(text);
	});
});

describe("redact", () => {
	it("masks sensitive keys at any depth", () => {
		const input = { password: "a", nested: { apiKey: "b", list: [{ authorization: "c", name: "kept" }] }, webhookUrl: "d" };
		expect(redact(input)).toEqual({
			password: "[REDACTED]",
			nested: { apiKey: "[REDACTED]", list: [{ authorization: "[REDACTED]", name: "kept" }] },
			webhookUrl: "[REDACTED]",
		});
	});

	it("redacts strings inside objects and arrays", () => {
		expect(redact({ urls: ["https://hooks.slack.com/services/T/B/X"] })).toEqual({ urls: ["https://hooks.slack.com/services/[REDACTED]"] });
	});

	it("serializes Error values instead of returning an empty object", () => {
		expect(redact({ error: new Error("boom") })).toEqual({ error: expect.objectContaining({ name: "Error", message: "boom" }) });
	});

	it("keeps primitives, null and dates as they are", () => {
		const date = new Date(0);
		expect(redact({ count: 3, ok: true, none: null, at: date })).toEqual({ count: 3, ok: true, none: null, at: date });
	});

	it("serializes values with toJSON the way JSON.stringify would", () => {
		const objectId = new mongoose.Types.ObjectId("65f1c2a4d8b9e0123456789a");
		expect(redact({ monitorId: objectId })).toEqual({ monitorId: "65f1c2a4d8b9e0123456789a" });
		expect(redact({ data: Buffer.from("hi") })).toEqual({ data: { type: "Buffer", data: [104, 105] } });
	});

	it("redacts credentials in a URL object", () => {
		expect(redact({ target: new URL("https://user:pw@example.com/path") })).toEqual({ target: "https://[REDACTED]@example.com/path" });
	});

	it("stops descending past the depth limit", () => {
		const deep = { a: { b: { c: { d: { e: { f: { password: "x" } } } } } } };
		expect(redact(deep)).toEqual(deep);
	});
});

describe("redactRecord", () => {
	it("masks sensitive keys and redacts values", () => {
		expect(redactRecord({ token: "t", url: "https://u:p@example.com" })).toEqual({ token: "[REDACTED]", url: "https://[REDACTED]@example.com" });
	});
});

describe("redactError", () => {
	it("redacts message, stack, details and every cause", () => {
		const secret = "https://hooks.slack.com/services/T/B/X";
		const result = redactError({
			name: "Error",
			message: `failed ${secret}`,
			stack: `Error: failed ${secret}\n    at x`,
			details: { apiKey: "k" },
			cause: { name: "Error", message: `root ${secret}` },
		});
		expect(result.message).toBe("failed https://hooks.slack.com/services/[REDACTED]");
		expect(result.stack).not.toContain("T/B/X");
		expect(result.details).toEqual({ apiKey: "[REDACTED]" });
		expect(result.cause?.message).toBe("root https://hooks.slack.com/services/[REDACTED]");
	});
});
