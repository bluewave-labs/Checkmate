import { describe, expect, it } from "@jest/globals";
import { editUserBodyValidation } from "../../../src/api/validation/userValidation.ts";

const validPassword = "OldPass1!";
const validNewPassword = "NewPass1!";

describe("editUserBodyValidation", () => {
	// Regression: the Joi->Zod validation refactor (commit c3a41272a3) dropped
	// `password`/`newPassword` from this schema. Because z.object() strips
	// unknown keys, the change-password flow in userService.editUser silently
	// became a no-op. Both fields must survive parsing.
	it("retains password and newPassword on the parsed body", () => {
		const result = editUserBodyValidation.safeParse({
			password: validPassword,
			newPassword: validNewPassword,
		});
		expect(result.success).toBe(true);
		expect(result.data).toEqual({
			password: validPassword,
			newPassword: validNewPassword,
		});
	});

	it("accepts a profile-only edit with neither password field", () => {
		const result = editUserBodyValidation.safeParse({ firstName: "Ada", lastName: "Lovelace" });
		expect(result.success).toBe(true);
	});

	it("rejects password without newPassword", () => {
		const result = editUserBodyValidation.safeParse({ password: validPassword });
		expect(result.success).toBe(false);
	});

	it("rejects newPassword without password", () => {
		const result = editUserBodyValidation.safeParse({ newPassword: validNewPassword });
		expect(result.success).toBe(false);
	});

	it("rejects a newPassword that does not meet the strength policy", () => {
		const result = editUserBodyValidation.safeParse({
			password: validPassword,
			newPassword: "weak",
		});
		expect(result.success).toBe(false);
	});

	// Regression: `deleteProfileImage` was missing from this schema, so z.object()
	// stripped it before it reached the repository and the remove-profile-image
	// flow was silently a no-op. The flag arrives as the multipart form-data
	// string "true", so it must both survive parsing and coerce to a boolean.
	it("retains deleteProfileImage and coerces the multipart string 'true' to boolean true", () => {
		const result = editUserBodyValidation.safeParse({ deleteProfileImage: "true" });
		expect(result.success).toBe(true);
		expect(result.data).toEqual({ deleteProfileImage: true });
	});

	it("coerces the multipart string 'false' to boolean false", () => {
		const result = editUserBodyValidation.safeParse({ deleteProfileImage: "false" });
		expect(result.success).toBe(true);
		expect(result.data).toEqual({ deleteProfileImage: false });
	});

	it("rejects a non-boolean deleteProfileImage value", () => {
		const result = editUserBodyValidation.safeParse({ deleteProfileImage: "banana" });
		expect(result.success).toBe(false);
	});
});
