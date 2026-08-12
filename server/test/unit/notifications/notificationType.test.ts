import { describe, expect, it } from "@jest/globals";
import { NotificationModel } from "@/domain/notifications/notification.model.js";
import { NotificationChannels } from "@/domain/notifications/notification.type.js";

describe("NotificationChannels", () => {
	it("includes Rocket.Chat", () => {
		expect(NotificationChannels).toContain("rocket_chat");
	});

	it("allows Rocket.Chat to be persisted", () => {
		const typePath = NotificationModel.schema.path("type") as unknown as { enumValues: string[] };

		expect(typePath.enumValues).toContain("rocket_chat");
	});
});
