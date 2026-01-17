import type { Settings } from "@/types/index.js";
export interface ISettingsRepository {
	// create
	// fetch
	// update
	update(settings: Partial<Settings>): Promise<Settings>;
	// delete
}
