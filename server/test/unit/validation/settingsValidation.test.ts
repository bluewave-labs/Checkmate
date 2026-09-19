import { describe, expect, it } from "@jest/globals";
import { updateAppSettingsBodyValidation } from "../../../src/api/validation/settingsValidation.ts";
import { MAX_EGRESS_TARGETS } from "../../../src/domain/egress/egress.type.ts";

const validNotificationId = "64b7f0c2a1d2e3f4a5b6c7d8";

describe("settingsValidation", () => {
	describe("updateAppSettingsBodyValidation egress fields", () => {
		it("accepts a full set of valid egress settings", () => {
			const parsed = updateAppSettingsBodyValidation.parse({
				egressCheckEnabled: true,
				egressCheckTargets: ["1.1.1.1", "dns.google:53", "https://example.com/health"],
				egressNotifications: [validNotificationId],
			});

			expect(parsed.egressCheckEnabled).toBe(true);
			expect(parsed.egressCheckTargets).toEqual(["1.1.1.1", "dns.google:53", "https://example.com/health"]);
			expect(parsed.egressNotifications).toEqual([validNotificationId]);
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

		it("accepts an empty notification list", () => {
			expect(updateAppSettingsBodyValidation.parse({ egressNotifications: [] }).egressNotifications).toEqual([]);
		});

		it("accepts upper-case hex notification ids", () => {
			const id = "64B7F0C2A1D2E3F4A5B6C7D8";
			expect(updateAppSettingsBodyValidation.parse({ egressNotifications: [id] }).egressNotifications).toEqual([id]);
		});

		it("rejects notification ids that are not 24-character hex", () => {
			for (const id of ["not-an-id", "64b7f0c2a1d2e3f4a5b6c7d", "zzzzzzzzzzzzzzzzzzzzzzzz", 123]) {
				expect(() => updateAppSettingsBodyValidation.parse({ egressNotifications: [id] })).toThrow();
			}
		});

		it("rejects a non-boolean enabled flag", () => {
			expect(() => updateAppSettingsBodyValidation.parse({ egressCheckEnabled: "yes" })).toThrow();
		});
	});
});
