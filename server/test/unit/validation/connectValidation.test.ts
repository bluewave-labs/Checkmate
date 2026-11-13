import { describe, expect, it } from "@jest/globals";
import {
	connectImportKeyBodyValidation,
	connectRestoreBodyValidation,
	connectScheduleBodyValidation,
} from "../../../src/api/validation/connectValidation.ts";

const KEY = "ab".repeat(32);

describe("connectValidation", () => {
	describe("connectImportKeyBodyValidation", () => {
		it("accepts a key and defaults replaceExisting to false", () => {
			expect(connectImportKeyBodyValidation.parse({ recoveryKey: KEY })).toEqual({ recoveryKey: KEY, replaceExisting: false });
		});

		it("trims and lower-cases the key", () => {
			const parsed = connectImportKeyBodyValidation.parse({ recoveryKey: `  ${KEY.toUpperCase()}\n`, replaceExisting: true });

			expect(parsed).toEqual({ recoveryKey: KEY, replaceExisting: true });
		});

		it.each([
			["too short", "ab".repeat(31)],
			["too long", "ab".repeat(33)],
			["not hex", "zz".repeat(32)],
			["empty", ""],
			["spaced", `${"ab".repeat(16)} ${"ab".repeat(16)}`],
		])("rejects a key that is %s", (_label, recoveryKey) => {
			expect(() => connectImportKeyBodyValidation.parse({ recoveryKey })).toThrow("Recovery key must be 64 hexadecimal characters");
		});

		it("rejects a missing key and a non-boolean replaceExisting", () => {
			expect(() => connectImportKeyBodyValidation.parse({})).toThrow();
			expect(() => connectImportKeyBodyValidation.parse({ recoveryKey: KEY, replaceExisting: "yes" })).toThrow();
		});
	});

	describe("connectRestoreBodyValidation", () => {
		it("accepts a backup id", () => {
			const backupId = "0d3f5a2e-8c1b-4e7a-9f2d-6b5c4a3e2f1d";

			expect(connectRestoreBodyValidation.parse({ backupId })).toEqual({ backupId });
		});

		it.each([
			["missing", undefined],
			["too short", "0d3f5a2e-8c1b-4e7a"],
			["upper case", "0D3F5A2E-8C1B-4E7A-9F2D-6B5C4A3E2F1D"],
			["a path", "../../../../../etc/passwd/xxxxxxxxxxx"],
		])("rejects a backup id that is %s", (_label, backupId) => {
			expect(() => connectRestoreBodyValidation.parse({ backupId })).toThrow();
		});
	});

	describe("connectScheduleBodyValidation", () => {
		it("defaults to a daily full backup", () => {
			expect(connectScheduleBodyValidation.parse({ enabled: true })).toEqual({ enabled: true, intervalHours: 24, kind: "full" });
		});

		it("keeps the given interval and kind", () => {
			expect(connectScheduleBodyValidation.parse({ enabled: false, intervalHours: 168, kind: "config" })).toEqual({
				enabled: false,
				intervalHours: 168,
				kind: "config",
			});
		});

		it.each([24, 72, 168])("accepts %i hours", (intervalHours) => {
			expect(connectScheduleBodyValidation.parse({ enabled: true, intervalHours }).intervalHours).toBe(intervalHours);
		});

		it.each([0, 6, 12, 48, 169, 24.5, "24", null])("rejects %p hours", (intervalHours) => {
			expect(() => connectScheduleBodyValidation.parse({ enabled: true, intervalHours })).toThrow();
		});

		it("rejects an unknown kind", () => {
			expect(() => connectScheduleBodyValidation.parse({ enabled: true, kind: "logs" })).toThrow();
		});

		it("requires enabled to be a boolean", () => {
			expect(() => connectScheduleBodyValidation.parse({})).toThrow();
			expect(() => connectScheduleBodyValidation.parse({ enabled: "true" })).toThrow();
		});
	});
});
