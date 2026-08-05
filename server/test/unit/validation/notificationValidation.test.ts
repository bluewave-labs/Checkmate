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
});
