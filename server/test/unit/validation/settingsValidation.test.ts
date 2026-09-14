import { describe, expect, it } from "@jest/globals";
import { updateAppSettingsBodyValidation } from "../../../src/api/validation/settingsValidation.ts";
import { MAX_EGRESS_POLL_INTERVAL_SECONDS, MAX_EGRESS_TARGETS, MIN_EGRESS_POLL_INTERVAL_SECONDS } from "../../../src/domain/egress/egress.type.ts";

const validNotificationId = "64b7f0c2a1d2e3f4a5b6c7d8";

describe("settingsValidation", () => {
	describe("updateAppSettingsBodyValidation egress fields", () => {
		it("accepts a full set of valid egress settings", () => {
			const parsed = updateAppSettingsBodyValidation.parse({
				egressCheckEnabled: true,
				egressCheckTargets: ["1.1.1.1", "dns.google:53", "https://example.com/health"],
				egressPollIntervalSeconds: 30,
				egressNotifications: [validNotificationId],
			});

			expect(parsed.egressCheckEnabled).toBe(true);
			expect(parsed.egressCheckTargets).toEqual(["1.1.1.1", "dns.google:53", "https://example.com/health"]);
			expect(parsed.egressPollIntervalSeconds).toBe(30);
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

		it("rejects targets that are not a host, host:port or http(s) URL", () => {
			for (const target of ["", "   ", "ftp://example.com", "bad host", "1.1.1.1;rm"]) {
				expect(() => updateAppSettingsBodyValidation.parse({ egressCheckTargets: [target] })).toThrow();
			}
		});

		it("accepts the poll interval boundaries", () => {
			expect(updateAppSettingsBodyValidation.parse({ egressPollIntervalSeconds: MIN_EGRESS_POLL_INTERVAL_SECONDS }).egressPollIntervalSeconds).toBe(
				MIN_EGRESS_POLL_INTERVAL_SECONDS
			);
			expect(updateAppSettingsBodyValidation.parse({ egressPollIntervalSeconds: MAX_EGRESS_POLL_INTERVAL_SECONDS }).egressPollIntervalSeconds).toBe(
				MAX_EGRESS_POLL_INTERVAL_SECONDS
			);
		});

		it("rejects out-of-range and non-integer poll intervals", () => {
			for (const interval of [MIN_EGRESS_POLL_INTERVAL_SECONDS - 1, MAX_EGRESS_POLL_INTERVAL_SECONDS + 1, 0, -5, 30.5, "30"]) {
				expect(() => updateAppSettingsBodyValidation.parse({ egressPollIntervalSeconds: interval })).toThrow();
			}
		});

		it("accepts an empty notification list", () => {
			expect(updateAppSettingsBodyValidation.parse({ egressNotifications: [] }).egressNotifications).toEqual([]);
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
