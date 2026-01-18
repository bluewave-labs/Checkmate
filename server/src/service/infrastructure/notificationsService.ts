import type { Monitor } from "@/types/index.js";
interface INotificationSerivce {
	handleNotifications: (moniotr: Monitor) => Promise<void>;
}
