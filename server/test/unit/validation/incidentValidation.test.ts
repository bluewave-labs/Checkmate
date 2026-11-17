import { describe, expect, it } from "@jest/globals";
import { getStorageIncidentEventsQueryValidation } from "../../../src/api/validation/incidentValidation.ts";

describe("getStorageIncidentEventsQueryValidation", () => {
	it("splits comma-separated subjects and drops blanks", () => {
		const result = getStorageIncidentEventsQueryValidation.parse({ monitorId: "mon-1", subjects: "WD-1, /dev/md1,," });
		expect(result).toEqual({ monitorId: "mon-1", subjects: ["WD-1", "/dev/md1"] });
	});

	it("requires a monitor id", () => {
		expect(getStorageIncidentEventsQueryValidation.safeParse({ subjects: "WD-1" }).success).toBe(false);
		expect(getStorageIncidentEventsQueryValidation.safeParse({ monitorId: "", subjects: "WD-1" }).success).toBe(false);
	});

	it("requires at least one subject", () => {
		expect(getStorageIncidentEventsQueryValidation.safeParse({ monitorId: "mon-1" }).success).toBe(false);
		expect(getStorageIncidentEventsQueryValidation.safeParse({ monitorId: "mon-1", subjects: " , " }).success).toBe(false);
	});

	it("caps the number of subjects", () => {
		const subjects = Array.from({ length: 21 }, (_, i) => `S-${i}`).join(",");
		expect(getStorageIncidentEventsQueryValidation.safeParse({ monitorId: "mon-1", subjects }).success).toBe(false);
	});
});
