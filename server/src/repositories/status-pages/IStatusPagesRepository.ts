import type { StatusPage } from "@/types/statusPage.js";

export interface IStatusPagesRepository {
	// create
	// single fetch
	// collection fetch
	// update
	// delete
	// other
	removeMonitorFromStatusPages(monitorId: string): Promise<number>;
}
