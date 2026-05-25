import { describe, expect, it, jest, afterEach } from "@jest/globals";
import {
	createMaintenanceWindowBodyValidation,
	editMaintenanceByIdWindowBodyValidation,
} from "../../../src/validation/maintenanceWindowValidation.ts";

const FROZEN_NOW = new Date("2026-05-07T12:00:00Z").getTime();

const baseCreateBody = (overrides: Record<string, unknown> = {}) => ({
	monitors: ["mon-1"],
	name: "Scheduled Maintenance",
	duration: 60,
	durationUnit: "minutes",
	start: new Date(FROZEN_NOW + 60 * 60 * 1000).toISOString(),
	end: new Date(FROZEN_NOW + 2 * 60 * 60 * 1000).toISOString(),
	repeat: 0,
	...overrides,
});

afterEach(() => {
	jest.useRealTimers();
});

describe("createMaintenanceWindowBodyValidation", () => {
	it("accepts a valid one-time window with end in the future", () => {
		jest.useFakeTimers().setSystemTime(FROZEN_NOW);
		const result = createMaintenanceWindowBodyValidation.safeParse(baseCreateBody());
		expect(result.success).toBe(true);
	});

	it("accepts a recurring window even when end is in the past", () => {
		jest.useFakeTimers().setSystemTime(FROZEN_NOW);
		const result = createMaintenanceWindowBodyValidation.safeParse(
			baseCreateBody({
				repeat: 1,
				start: new Date(FROZEN_NOW - 2 * 60 * 60 * 1000).toISOString(),
				end: new Date(FROZEN_NOW - 60 * 60 * 1000).toISOString(),
			})
		);
		expect(result.success).toBe(true);
	});

	it("rejects when end is before start", () => {
		jest.useFakeTimers().setSystemTime(FROZEN_NOW);
		const result = createMaintenanceWindowBodyValidation.safeParse(
			baseCreateBody({
				start: new Date(FROZEN_NOW + 2 * 60 * 60 * 1000).toISOString(),
				end: new Date(FROZEN_NOW + 60 * 60 * 1000).toISOString(),
			})
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ message: "End must be after start", path: ["end"] })]));
		}
	});

	it("rejects when end equals start", () => {
		jest.useFakeTimers().setSystemTime(FROZEN_NOW);
		const sameInstant = new Date(FROZEN_NOW + 60 * 60 * 1000).toISOString();
		const result = createMaintenanceWindowBodyValidation.safeParse(baseCreateBody({ start: sameInstant, end: sameInstant }));
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ message: "End must be after start", path: ["end"] })]));
		}
	});

	it("rejects a one-time window with end in the past", () => {
		jest.useFakeTimers().setSystemTime(FROZEN_NOW);
		const result = createMaintenanceWindowBodyValidation.safeParse(
			baseCreateBody({
				start: new Date(FROZEN_NOW - 2 * 60 * 60 * 1000).toISOString(),
				end: new Date(FROZEN_NOW - 60 * 60 * 1000).toISOString(),
			})
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						message: "End must be in the future for one-time maintenance windows",
						path: ["end"],
					}),
				])
			);
		}
	});

	it("rejects a one-time window with end exactly equal to now", () => {
		jest.useFakeTimers().setSystemTime(FROZEN_NOW);
		const result = createMaintenanceWindowBodyValidation.safeParse(
			baseCreateBody({
				start: new Date(FROZEN_NOW - 60 * 60 * 1000).toISOString(),
				end: new Date(FROZEN_NOW).toISOString(),
			})
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						message: "End must be in the future for one-time maintenance windows",
						path: ["end"],
					}),
				])
			);
		}
	});

	it("rejects unknown fields under .strict()", () => {
		jest.useFakeTimers().setSystemTime(FROZEN_NOW);
		const result = createMaintenanceWindowBodyValidation.safeParse(baseCreateBody({ teamId: "team-1" }));
		expect(result.success).toBe(false);
	});

	it("rejects an invalid durationUnit value", () => {
		jest.useFakeTimers().setSystemTime(FROZEN_NOW);
		const result = createMaintenanceWindowBodyValidation.safeParse(baseCreateBody({ durationUnit: "weeks" }));
		expect(result.success).toBe(false);
	});

	it("rejects a missing required field", () => {
		jest.useFakeTimers().setSystemTime(FROZEN_NOW);
		const { name: _name, ...withoutName } = baseCreateBody();
		const result = createMaintenanceWindowBodyValidation.safeParse(withoutName);
		expect(result.success).toBe(false);
	});
});

describe("editMaintenanceByIdWindowBodyValidation", () => {
	it("accepts an empty body (all fields optional)", () => {
		const result = editMaintenanceByIdWindowBodyValidation.safeParse({});
		expect(result.success).toBe(true);
	});

	it("accepts a partial update with only active toggled", () => {
		const result = editMaintenanceByIdWindowBodyValidation.safeParse({ active: false });
		expect(result.success).toBe(true);
	});

	it("rejects unknown fields under .strict()", () => {
		const result = editMaintenanceByIdWindowBodyValidation.safeParse({
			active: false,
			id: "mw-1",
		});
		expect(result.success).toBe(false);
	});

	it("rejects when start and end are both present and end <= start", () => {
		const start = new Date("2026-05-08T10:00:00Z").toISOString();
		const end = new Date("2026-05-08T09:00:00Z").toISOString();
		const result = editMaintenanceByIdWindowBodyValidation.safeParse({ start, end });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ message: "End must be after start", path: ["end"] })]));
		}
	});

	it("does not apply the start/end ordering rule when only end is provided", () => {
		const result = editMaintenanceByIdWindowBodyValidation.safeParse({
			end: new Date("2020-01-01T00:00:00Z").toISOString(),
		});
		expect(result.success).toBe(true);
	});

	it("does not apply the start/end ordering rule when only start is provided", () => {
		const result = editMaintenanceByIdWindowBodyValidation.safeParse({
			start: new Date("2099-01-01T00:00:00Z").toISOString(),
		});
		expect(result.success).toBe(true);
	});

	it("accepts a body without a monitors field (monitors is optional on edit)", () => {
		const result = editMaintenanceByIdWindowBodyValidation.safeParse({ name: "Updated Name" });
		expect(result.success).toBe(true);
	});

	it("accepts a body with one or more monitors", () => {
		const result = editMaintenanceByIdWindowBodyValidation.safeParse({ monitors: ["mon-1"] });
		expect(result.success).toBe(true);
	});

	it("rejects an empty monitors array", () => {
		const result = editMaintenanceByIdWindowBodyValidation.safeParse({ monitors: [] });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([expect.objectContaining({ message: "At least one monitor is required", path: ["monitors"] })])
			);
		}
	});
});
