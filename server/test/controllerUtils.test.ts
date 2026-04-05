import { jest } from "@jest/globals";
import {
	requireString,
	optionalString,
	optionalNumber,
	optionalBoolean,
	parseMonitorTypeFilter,
	parseSortOrder,
	requireTeamId,
	requireUserId,
	requireUserEmail,
	requireFirstName,
	requireUserRoles,
} from "../src/controllers/controllerUtils.ts";

describe("requireString", () => {
	it("returns the string when valid", () => {
		expect(requireString("hello", "name")).toBe("hello");
	});

	it("throws when value is an empty string", () => {
		expect(() => requireString("", "name")).toThrow("name is required");
	});

	it("throws when value is whitespace only", () => {
		expect(() => requireString("   ", "name")).toThrow("name is required");
	});

	it("throws when value is undefined", () => {
		expect(() => requireString(undefined, "name")).toThrow("name is required");
	});

	it("throws when value is null", () => {
		expect(() => requireString(null, "name")).toThrow("name is required");
	});

	it("throws when value is a number", () => {
		expect(() => requireString(123, "name")).toThrow("name is required");
	});
});

describe("optionalString", () => {
	it("returns undefined when value is undefined", () => {
		expect(optionalString(undefined, "field")).toBeUndefined();
	});

	it("returns the string when valid", () => {
		expect(optionalString("test", "field")).toBe("test");
	});

	it("returns empty string when value is empty string", () => {
		expect(optionalString("", "field")).toBe("");
	});

	it("throws when value is a number", () => {
		expect(() => optionalString(123, "field")).toThrow("field must be a string");
	});

	it("throws when value is null", () => {
		expect(() => optionalString(null, "field")).toThrow("field must be a string");
	});
});

describe("optionalNumber", () => {
	it("returns undefined when value is undefined", () => {
		expect(optionalNumber(undefined, "count")).toBeUndefined();
	});

	it("returns the number when valid", () => {
		expect(optionalNumber(42, "count")).toBe(42);
	});

	it("returns 0 when value is 0", () => {
		expect(optionalNumber(0, "count")).toBe(0);
	});

	it("parses a numeric string", () => {
		expect(optionalNumber("123", "count")).toBe(123);
	});

	it("parses a float string", () => {
		expect(optionalNumber("3.14", "count")).toBe(3.14);
	});

	it("throws for NaN", () => {
		expect(() => optionalNumber(NaN, "count")).toThrow("count must be a number");
	});

	it("throws for Infinity", () => {
		expect(() => optionalNumber(Infinity, "count")).toThrow("count must be a number");
	});

	it("throws for non-numeric string", () => {
		expect(() => optionalNumber("abc", "count")).toThrow("count must be a number");
	});

	it("throws for empty string", () => {
		expect(() => optionalNumber("", "count")).toThrow("count must be a number");
	});

	it("throws for boolean", () => {
		expect(() => optionalNumber(true, "count")).toThrow("count must be a number");
	});
});

describe("optionalBoolean", () => {
	it("returns undefined when value is undefined", () => {
		expect(optionalBoolean(undefined, "flag")).toBeUndefined();
	});

	it("returns true when value is true", () => {
		expect(optionalBoolean(true, "flag")).toBe(true);
	});

	it("returns false when value is false", () => {
		expect(optionalBoolean(false, "flag")).toBe(false);
	});

	it('returns true for string "true"', () => {
		expect(optionalBoolean("true", "flag")).toBe(true);
	});

	it('returns false for string "false"', () => {
		expect(optionalBoolean("false", "flag")).toBe(false);
	});

	it("throws for other strings", () => {
		expect(() => optionalBoolean("yes", "flag")).toThrow("flag must be a boolean");
	});

	it("throws for numbers", () => {
		expect(() => optionalBoolean(1, "flag")).toThrow("flag must be a boolean");
	});
});

describe("parseSortOrder", () => {
	it("returns undefined when value is undefined", () => {
		expect(parseSortOrder(undefined)).toBeUndefined();
	});

	it('returns "asc" for "asc"', () => {
		expect(parseSortOrder("asc")).toBe("asc");
	});

	it('returns "desc" for "desc"', () => {
		expect(parseSortOrder("desc")).toBe("desc");
	});

	it("throws for invalid sort order", () => {
		expect(() => parseSortOrder("ascending")).toThrow("order must be either 'asc' or 'desc'");
	});

	it("throws for numbers", () => {
		expect(() => parseSortOrder(1)).toThrow("order must be either 'asc' or 'desc'");
	});
});

describe("requireTeamId", () => {
	it("returns the team ID when valid", () => {
		expect(requireTeamId("team-123")).toBe("team-123");
	});

	it("throws when team ID is undefined", () => {
		expect(() => requireTeamId(undefined)).toThrow("Team ID is required");
	});

	it("throws when team ID is empty string", () => {
		expect(() => requireTeamId("")).toThrow("Team ID is required");
	});
});

describe("requireUserId", () => {
	it("returns the user ID when valid", () => {
		expect(requireUserId("user-456")).toBe("user-456");
	});

	it("throws when user ID is undefined", () => {
		expect(() => requireUserId(undefined)).toThrow("User ID is required");
	});

	it("throws when user ID is empty string", () => {
		expect(() => requireUserId("")).toThrow("User ID is required");
	});
});

describe("requireUserEmail", () => {
	it("returns the email when valid", () => {
		expect(requireUserEmail("test@example.com")).toBe("test@example.com");
	});

	it("throws when email is undefined", () => {
		expect(() => requireUserEmail(undefined)).toThrow("User email is required");
	});

	it("throws when email is empty string", () => {
		expect(() => requireUserEmail("")).toThrow("User email is required");
	});
});

describe("requireFirstName", () => {
	it("returns the first name when valid", () => {
		expect(requireFirstName("John")).toBe("John");
	});

	it("throws when first name is undefined", () => {
		expect(() => requireFirstName(undefined)).toThrow("First name is required");
	});

	it("throws when first name is empty string", () => {
		expect(() => requireFirstName("")).toThrow("First name is required");
	});
});

describe("requireUserRoles", () => {
	it("returns the roles when valid", () => {
		const roles = ["admin" as any];
		expect(requireUserRoles(roles)).toEqual(roles);
	});

	it("throws when roles is undefined", () => {
		expect(() => requireUserRoles(undefined)).toThrow("User roles are required");
	});

	it("throws when roles is empty array", () => {
		expect(() => requireUserRoles([])).toThrow("User roles are required");
	});
});
