import { describe, expect, it } from "@jest/globals";
import { isWindowActive } from "../../../src/utils/maintenanceWindow.ts";
import type { MaintenanceWindow } from "../../../src/types/index.ts";

const makeWindow = (overrides?: Partial<MaintenanceWindow>): MaintenanceWindow => {
	const now = Date.now();
	return {
		id: "mw-1",
		monitorIds: ["mon-1"],
		teamId: "team-1",
		active: true,
		name: "Scheduled Maintenance",
		duration: 60,
		durationUnit: "minutes",
		repeat: 0,
		start: new Date(now - 1000).toISOString(),
		end: new Date(now + 1000).toISOString(),
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
		...overrides,
	};
};

describe("isWindowActive", () => {
	it("returns false when window.active is false even if dates span now", () => {
		expect(isWindowActive(makeWindow({ active: false }))).toBe(false);
	});

	it("returns true for a one-time window where now is between start and end", () => {
		expect(isWindowActive(makeWindow())).toBe(true);
	});

	it("returns false when the one-time window has not started yet", () => {
		const now = Date.now();
		expect(
			isWindowActive(
				makeWindow({
					start: new Date(now + 60_000).toISOString(),
					end: new Date(now + 120_000).toISOString(),
				})
			)
		).toBe(false);
	});

	it("returns false when the one-time window has already ended", () => {
		const now = Date.now();
		expect(
			isWindowActive(
				makeWindow({
					start: new Date(now - 120_000).toISOString(),
					end: new Date(now - 60_000).toISOString(),
					repeat: 0,
				})
			)
		).toBe(false);
	});

	it("returns true when a recurring window's advanced occurrence covers now", () => {
		const now = Date.now();
		// 2h ago, 10-min window, hourly repeat — third occurrence (0h) covers now
		expect(
			isWindowActive(
				makeWindow({
					start: new Date(now - 7_200_000).toISOString(),
					end: new Date(now - 7_200_000 + 600_000).toISOString(),
					repeat: 3_600_000,
				})
			)
		).toBe(true);
	});

	it("returns false when a recurring window's occurrences all miss now", () => {
		const now = Date.now();
		// 31min ago, 1-min window, hourly repeat → next occurrence ~29min from now
		expect(
			isWindowActive(
				makeWindow({
					start: new Date(now - 1_860_000).toISOString(),
					end: new Date(now - 1_800_000).toISOString(),
					repeat: 3_600_000,
				})
			)
		).toBe(false);
	});

	it("respects the explicit `now` parameter for comparisons", () => {
		const win = makeWindow({
			start: "2026-01-15T11:00:00Z",
			end: "2026-01-15T13:00:00Z",
		});
		expect(isWindowActive(win, new Date("2026-01-15T12:00:00Z"))).toBe(true);
		expect(isWindowActive(win, new Date("2026-01-15T14:00:00Z"))).toBe(false);
		expect(isWindowActive(win, new Date("2026-01-15T10:00:00Z"))).toBe(false);
	});
});
