import { describe, expect, it } from "@jest/globals";
import { createNotificationBodyValidation, editNotificationBodyValidation } from "../../../src/api/validation/notificationValidation.ts";

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
});

const telegramBody = {
	notificationName: "Telegram alerts",
	type: "telegram" as const,
	address: "-1001234567890",
};

const twilioBody = {
	notificationName: "Twilio SMS",
	type: "twilio" as const,
	accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
	phone: "+15551234567",
	twilioPhoneNumber: "+15557654321",
};

describe("notificationValidation — credentials on create", () => {
	it("requires a credential on every channel that authenticates with one", () => {
		expect(() => createNotificationBodyValidation.parse(telegramBody)).toThrow();
		expect(() => createNotificationBodyValidation.parse(twilioBody)).toThrow();
		expect(() =>
			createNotificationBodyValidation.parse({
				notificationName: "Matrix room",
				type: "matrix",
				homeserverUrl: "https://matrix.example.com",
				roomId: "!abc:example.com",
			})
		).toThrow();
	});

	it("accepts a body that carries the credential", () => {
		const parsed = createNotificationBodyValidation.parse({ ...telegramBody, accessToken: "bot-token" });

		expect(parsed.accessToken).toBe("bot-token");
	});
});

describe("notificationValidation — credentials on edit", () => {
	it("accepts a body that omits the credential, which keeps the stored one", () => {
		const parsed = editNotificationBodyValidation.parse(telegramBody);

		expect(parsed).not.toHaveProperty("accessToken");
	});

	it("accepts a replacement credential", () => {
		const parsed = editNotificationBodyValidation.parse({ ...telegramBody, accessToken: "new-token" });

		expect(parsed.accessToken).toBe("new-token");
	});

	it("rejects an empty credential, so a required one cannot be blanked out", () => {
		expect(() => editNotificationBodyValidation.parse({ ...telegramBody, accessToken: "" })).toThrow();
		expect(() => editNotificationBodyValidation.parse({ ...twilioBody, accessToken: "" })).toThrow();
	});

	it("still requires the fields that are not credentials", () => {
		// accountSid is a Twilio identifier, not a credential: it is returned to the client, so the
		// client can always send it back.
		expect(() =>
			editNotificationBodyValidation.parse({
				notificationName: "Twilio SMS",
				type: "twilio",
				phone: "+15551234567",
				twilioPhoneNumber: "+15557654321",
			})
		).toThrow();

		expect(() => editNotificationBodyValidation.parse({ ...telegramBody, address: "" })).toThrow();
	});

	it("leaves channels without a credential unchanged", () => {
		const parsed = editNotificationBodyValidation.parse({
			notificationName: "Ops webhook",
			type: "webhook",
			address: "https://example.com/hooks/checkmate",
		});

		expect(parsed.type).toBe("webhook");
	});
});
