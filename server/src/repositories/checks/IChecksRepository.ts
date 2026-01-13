import type { LatestChecksMap } from "@/repositories/checks/MongoChecksRepistory.js";

export interface IChecksRepository {
	// create
	// single fetch
	// collection fetch
	findLatestChecksByMonitorIds(monitorIds: string[]): Promise<LatestChecksMap>;
	// update
	// delete
}
