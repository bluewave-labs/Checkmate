import { describe, expect, it } from "@jest/globals";
import { createProxyBodyValidation, editProxyBodyValidation, proxyResponseSchema } from "../../../src/api/validation/proxyValidation.ts";

const validBody = {
	name: "Egress proxy",
	protocol: "http" as const,
	host: "proxy.internal",
	port: 3128,
};

describe("proxyValidation", () => {
	describe("createProxyBodyValidation", () => {
		it("accepts a minimal valid body", () => {
			const parsed = createProxyBodyValidation.parse(validBody);

			expect(parsed).toEqual(validBody);
		});

		it("accepts optional credentials", () => {
			const parsed = createProxyBodyValidation.parse({ ...validBody, username: "user", password: "secret" });

			expect(parsed.username).toBe("user");
			expect(parsed.password).toBe("secret");
		});

		it("rejects an empty name", () => {
			expect(() => createProxyBodyValidation.parse({ ...validBody, name: "" })).toThrow();
		});

		it("rejects an empty host", () => {
			expect(() => createProxyBodyValidation.parse({ ...validBody, host: "" })).toThrow();
		});

		it("rejects a protocol outside the tuple", () => {
			expect(() => createProxyBodyValidation.parse({ ...validBody, protocol: "socks5" })).toThrow();
		});

		it("accepts the port boundaries", () => {
			expect(createProxyBodyValidation.parse({ ...validBody, port: 1 }).port).toBe(1);
			expect(createProxyBodyValidation.parse({ ...validBody, port: 65535 }).port).toBe(65535);
		});

		it("rejects out-of-range and non-integer ports", () => {
			for (const port of [0, -1, 65536, 3128.5, "3128"]) {
				expect(() => createProxyBodyValidation.parse({ ...validBody, port })).toThrow();
			}
		});
	});

	describe("editProxyBodyValidation", () => {
		it("accepts the create shape without clear flags", () => {
			const parsed = editProxyBodyValidation.parse(validBody);

			expect(parsed.clearPassword).toBeUndefined();
			expect(parsed.clearUsername).toBeUndefined();
		});

		it("accepts clearPassword and clearUsername", () => {
			const parsed = editProxyBodyValidation.parse({ ...validBody, clearPassword: true, clearUsername: true });

			expect(parsed.clearPassword).toBe(true);
			expect(parsed.clearUsername).toBe(true);
		});

		it("rejects non-boolean clear flags", () => {
			expect(() => editProxyBodyValidation.parse({ ...validBody, clearPassword: "yes" })).toThrow();
		});
	});

	describe("proxyResponseSchema", () => {
		const validResponse = {
			id: "proxy-1",
			teamId: "team-1",
			name: "Egress proxy",
			protocol: "http",
			host: "proxy.internal",
			port: 3128,
			hasPassword: false,
			createdAt: "2026-01-01T00:00:00Z",
			updatedAt: "2026-01-01T00:00:00Z",
		};

		it("accepts a masked proxy", () => {
			expect(() => proxyResponseSchema.parse(validResponse)).not.toThrow();
		});

		it("requires hasPassword", () => {
			const { hasPassword: _hasPassword, ...withoutFlag } = validResponse;

			expect(() => proxyResponseSchema.parse(withoutFlag)).toThrow();
		});

		it("does not declare a password field", () => {
			expect(Object.keys(proxyResponseSchema.shape)).not.toContain("password");
		});
	});
});
