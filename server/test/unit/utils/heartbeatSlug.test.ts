import { describe, expect, it } from "@jest/globals";
import { toHeartbeatSlug } from "../../../src/utils/heartbeatSlug.ts";
import { HEARTBEAT_SLUG_MAX_LENGTH, HEARTBEAT_SLUG_PATTERN } from "../../../src/domain/heartbeat/heartbeat.type.ts";

const COMBINING_ACUTE = String.fromCharCode(0x0301);

describe("toHeartbeatSlug", () => {
	it.each([
		["Nightly Backup", "nightly-backup"],
		["  DB -- vacuum!! ", "db-vacuum"],
		["Café Export", "cafe-export"],
		[`Cafe${COMBINING_ACUTE} Export`, "cafe-export"], // already decomposed
		["report_export.v2", "report-export-v2"],
		["already-a-slug", "already-a-slug"],
	])("turns %j into %j", (name, slug) => {
		expect(toHeartbeatSlug(name)).toBe(slug);
	});

	it.each([["日本語"], ["!!!"], [""]])("falls back to 'heartbeat' when %j has nothing usable", (name) => {
		expect(toHeartbeatSlug(name)).toBe("heartbeat");
	});

	it("cuts to the max length without leaving a trailing hyphen", () => {
		const slug = toHeartbeatSlug(`${"a".repeat(HEARTBEAT_SLUG_MAX_LENGTH - 1)} b`);

		expect(slug).toBe("a".repeat(HEARTBEAT_SLUG_MAX_LENGTH - 1));
	});

	it("cuts long names to the max length", () => {
		expect(toHeartbeatSlug("x".repeat(HEARTBEAT_SLUG_MAX_LENGTH + 10))).toHaveLength(HEARTBEAT_SLUG_MAX_LENGTH);
	});

	it.each([["Nightly Backup"], ["  DB -- vacuum!! "], ["Café Export"], ["日本語"], [`${"a".repeat(63)} b`], ["--a--b--"], ["A1 B2 C3"]])(
		"produces a slug that passes validation for %j",
		(name) => {
			expect(toHeartbeatSlug(name)).toMatch(HEARTBEAT_SLUG_PATTERN);
		}
	);
});
