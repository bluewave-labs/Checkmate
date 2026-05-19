import { describe, expect, it } from "@jest/globals";
import {
	createStatusPageBodyValidation,
	updateStatusPageBodyValidation,
	unlockBodyValidation,
} from "../../../src/validation/statusPageValidation.ts";

const baseBody = {
	type: ["uptime"],
	companyName: "Acme",
	url: "acme",
	monitors: ["6510f8eef0dabd4cc4f5d3aa"],
	isPublished: true,
	showUptimePercentage: true,
};

describe("createStatusPageBodyValidation", () => {
	it("accepts a valid body without password", () => {
		expect(() => createStatusPageBodyValidation.parse(baseBody)).not.toThrow();
	});

	it("accepts an 8-character password", () => {
		expect(() => createStatusPageBodyValidation.parse({ ...baseBody, password: "abcdefgh" })).not.toThrow();
	});

	it("rejects a 7-character password", () => {
		expect(() => createStatusPageBodyValidation.parse({ ...baseBody, password: "abcdefg" })).toThrow();
	});

	it("ignores removePassword (create has nothing to remove)", () => {
		const parsed = createStatusPageBodyValidation.parse({ ...baseBody, removePassword: true });
		expect("removePassword" in parsed).toBe(false);
	});
});

describe("updateStatusPageBodyValidation", () => {
	it("accepts password alone", () => {
		expect(() => updateStatusPageBodyValidation.parse({ ...baseBody, password: "abcdefgh" })).not.toThrow();
	});

	it("accepts removePassword alone", () => {
		expect(() => updateStatusPageBodyValidation.parse({ ...baseBody, removePassword: true })).not.toThrow();
	});

	it("coerces stringified removePassword from multipart bodies", () => {
		// multer delivers non-file fields as strings; removePassword must coerce
		// like its boolean siblings (isPublished, showCharts, ...).
		const parsed = updateStatusPageBodyValidation.parse({ ...baseBody, removePassword: "true" });
		expect(parsed.removePassword).toBe(true);
	});

	it("rejects both password and removePassword in the same body", () => {
		expect(() =>
			updateStatusPageBodyValidation.parse({
				...baseBody,
				password: "abcdefgh",
				removePassword: true,
			})
		).toThrow();
	});
});

describe("unlockBodyValidation", () => {
	it("accepts a non-empty password", () => {
		expect(() => unlockBodyValidation.parse({ password: "anything" })).not.toThrow();
	});

	it("rejects an empty body", () => {
		expect(() => unlockBodyValidation.parse({})).toThrow();
	});

	it("rejects an empty-string password", () => {
		expect(() => unlockBodyValidation.parse({ password: "" })).toThrow();
	});
});
