import { describe, expect, it } from "@jest/globals";
import { createNotificationBodyValidation } from "@/api/validation/notificationValidation.js";

describe("notification validation", () => {
	it("accepts a Rocket.Chat incoming webhook", () => {
		const result = createNotificationBodyValidation.safeParse({
			notificationName: "Rocket.Chat alerts",
			type: "rocket_chat",
			address: "https://chat.example.com/hooks/integration-id/token",
		});

		expect(result.success).toBe(true);
	});

	it("accepts a self-hosted Rocket.Chat webhook over HTTP", () => {
		const result = createNotificationBodyValidation.safeParse({
			notificationName: "Local Rocket.Chat alerts",
			type: "rocket_chat",
			address: "http://localhost:3000/hooks/integration-id/token",
		});

		expect(result.success).toBe(true);
	});

	it("rejects an invalid Rocket.Chat incoming webhook URL", () => {
		const result = createNotificationBodyValidation.safeParse({
			notificationName: "Rocket.Chat alerts",
			type: "rocket_chat",
			address: "not-a-url",
		});

		expect(result.success).toBe(false);
	});

	it.each(["ftp://chat.example.com/hooks/integration-id/token", "mailto:admin@example.com", "data:text/plain,hello", "javascript:alert(1)"])(
		"rejects a Rocket.Chat webhook using an unsupported protocol: %s",
		(address) => {
			const result = createNotificationBodyValidation.safeParse({
				notificationName: "Rocket.Chat alerts",
				type: "rocket_chat",
				address,
			});

			expect(result.success).toBe(false);
		}
	);

	describe("ntfy authentication", () => {
		const parseNtfy = (overrides: Record<string, unknown>) =>
			createNotificationBodyValidation.safeParse({
				notificationName: "ntfy alerts",
				type: "ntfy",
				address: "https://ntfy.example.com",
				topic: "checkmate-alerts",
				...overrides,
			});

		const pathsOf = (result: ReturnType<typeof parseNtfy>) => (result.success ? [] : result.error.issues.map((issue) => issue.path.join(".")));

		it("accepts an unauthenticated channel", () => {
			expect(parseNtfy({}).success).toBe(true);
		});

		it("accepts an explicit auth type of none", () => {
			expect(parseNtfy({ ntfyAuthType: "none" }).success).toBe(true);
		});

		it("accepts token auth with an access token", () => {
			expect(parseNtfy({ ntfyAuthType: "token", accessToken: "tk_secret" }).success).toBe(true);
		});

		it("accepts basic auth with a username and password", () => {
			expect(parseNtfy({ ntfyAuthType: "basic", ntfyUsername: "alice", accessToken: "s3cret" }).success).toBe(true);
		});

		it("rejects an unknown auth type", () => {
			expect(parseNtfy({ ntfyAuthType: "oauth" }).success).toBe(false);
		});

		it("rejects token auth without an access token", () => {
			expect(pathsOf(parseNtfy({ ntfyAuthType: "token" }))).toContain("accessToken");
		});

		it("rejects token auth carrying a username", () => {
			expect(pathsOf(parseNtfy({ ntfyAuthType: "token", accessToken: "tk_secret", ntfyUsername: "alice" }))).toContain("ntfyUsername");
		});

		it("rejects basic auth without a username", () => {
			expect(pathsOf(parseNtfy({ ntfyAuthType: "basic", accessToken: "s3cret" }))).toContain("ntfyUsername");
		});

		it("rejects basic auth without a password", () => {
			expect(pathsOf(parseNtfy({ ntfyAuthType: "basic", ntfyUsername: "alice" }))).toContain("accessToken");
		});

		it("reports both fields when basic auth is entirely empty", () => {
			expect(pathsOf(parseNtfy({ ntfyAuthType: "basic" }))).toEqual(expect.arrayContaining(["ntfyUsername", "accessToken"]));
		});

		// Credentials with auth off would be stored but never sent, which reads as protected
		// while posting anonymously.
		it("rejects credentials supplied without an auth type", () => {
			expect(pathsOf(parseNtfy({ accessToken: "tk_secret" }))).toContain("accessToken");
			expect(pathsOf(parseNtfy({ ntfyUsername: "alice" }))).toContain("ntfyUsername");
		});

		it("still requires a topic and a valid server URL", () => {
			expect(parseNtfy({ topic: "" }).success).toBe(false);
			expect(parseNtfy({ address: "not-a-url" }).success).toBe(false);
		});
	});
});
