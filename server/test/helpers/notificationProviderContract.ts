import { describe, expect, it } from "@jest/globals";
import type { INotificationProvider } from "../../src/service/infrastructure/notificationProviders/INotificationProvider.ts";
import type { Notification } from "../../src/types/index.ts";
import type { NotificationMessage } from "../../src/types/notificationMessage.ts";

const makeMessage = (): NotificationMessage => ({
	type: "monitor_down",
	severity: "critical",
	monitor: { id: "mon-1", name: "Test", url: "https://example.com", type: "http", status: "down" },
	content: {
		title: "Monitor Down: Test",
		summary: "Test is down",
		details: ["URL: https://example.com"],
		timestamp: new Date("2025-01-01T00:00:00Z"),
	},
	clientHost: "https://app.example.com",
	metadata: { teamId: "team-1", notificationReason: "status_change" },
});

export const testNotificationProviderContract = (
	name: string,
	opts: {
		create: () => INotificationProvider;
		makeNotification: () => Partial<Notification>;
	}
) => {
	describe(`INotificationProvider contract: ${name}`, () => {
		it("sendTestAlert returns a boolean", async () => {
			const provider = opts.create();
			const result = await provider.sendTestAlert(opts.makeNotification());
			expect(typeof result).toBe("boolean");
		});

		it("sendMessage returns a boolean", async () => {
			const provider = opts.create();
			const result = await provider.sendMessage(opts.makeNotification() as Notification, makeMessage());
			expect(typeof result).toBe("boolean");
		});
	});
};
