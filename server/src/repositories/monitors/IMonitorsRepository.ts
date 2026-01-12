import type { Monitor } from "@/types/index.js";
export interface IMonitorsRepository {
	// create
	// single fetch
	// collection fetch
	findAll(): Promise<Monitor[] | null>;
	// update
	// delete
}
