import { describe, expect, it } from "@jest/globals";
import { updateAppSettingsBodyValidation } from "../../../src/api/validation/settingsValidation.ts";
import { MAX_EGRESS_TARGETS } from "../../../src/domain/egress/egress.type.ts";

describe("settingsValidation", () => {
	describe("updateAppSettingsBodyValidation egress fields", () => {
		it("accepts a full set of valid egress settings", () => {
			const parsed = updateAppSettingsBodyValidation.parse({
				egressCheckEnabled: true,
				egressCheckTargets: ["1.1.1.1", "dns.google:53", "https://example.com/health"],
			});

			expect(parsed.egressCheckEnabled).toBe(true);
			expect(parsed.egressCheckTargets).toEqual(["1.1.1.1", "dns.google:53", "https://example.com/health"]);
		});

		it("accepts a body with no egress fields", () => {
			expect(() => updateAppSettingsBodyValidation.parse({ checkTTL: 30 })).not.toThrow();
		});

		it("accepts an empty target list (the worker falls back to the default targets)", () => {
			expect(updateAppSettingsBodyValidation.parse({ egressCheckTargets: [] }).egressCheckTargets).toEqual([]);
		});

		it("rejects more targets than the maximum", () => {
			const targets = Array.from({ length: MAX_EGRESS_TARGETS + 1 }, (_, i) => `10.0.0.${i}`);

			expect(() => updateAppSettingsBodyValidation.parse({ egressCheckTargets: targets })).toThrow();
		});

		it("accepts IPv6 targets, bare or bracketed with a port", () => {
			const targets = ["2606:4700:4700::1111", "[2606:4700:4700::1111]", "[2606:4700:4700::1111]:53", "localhost", "localhost:8080"];
			expect(updateAppSettingsBodyValidation.parse({ egressCheckTargets: targets }).egressCheckTargets).toEqual(targets);
		});

		it("rejects targets that are not a host, host:port or http(s) URL", () => {
			for (const target of ["", "   ", "ftp://example.com", "bad host", "1.1.1.1;rm", "http://"]) {
				expect(() => updateAppSettingsBodyValidation.parse({ egressCheckTargets: [target] })).toThrow();
			}
		});

		it("names the rejected target in the message, at its index", () => {
			const result = updateAppSettingsBodyValidation.safeParse({ egressCheckTargets: ["1.1.1.1", "ftp://example.com"] });

			expect(result.success).toBe(false);
			expect(result.error?.issues[0]).toMatchObject({
				path: ["egressCheckTargets", 1],
				message: '"ftp://example.com" is not a hostname or IP address, host:port, or http(s) URL',
			});
		});

		it("rejects malformed addresses that the probe could never reach", () => {
			for (const target of [
				"[1.1.1.1",
				"1.1.1.1]",
				"[::1",
				"::1]",
				"[[::1]]",
				"[not-an-address]:53",
				"999.1.1.1",
				"1.1.1.1:0",
				"1.1.1.1:70000",
				"[::1]:",
			]) {
				expect(() => updateAppSettingsBodyValidation.parse({ egressCheckTargets: [target] })).toThrow();
			}
		});

		it("rejects a non-boolean enabled flag", () => {
			expect(() => updateAppSettingsBodyValidation.parse({ egressCheckEnabled: "yes" })).toThrow();
		});
	});
});
