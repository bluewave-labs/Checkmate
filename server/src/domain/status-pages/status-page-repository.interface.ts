import type { StatusPage } from "@/domain/status-pages/status-page.type.js";

export interface IStatusPagesRepository {
	// create
	create(userId: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage>;
	// single fetch
	findByUrl(url: string): Promise<StatusPage>;
	findByCustomDomain(customDomain: string): Promise<StatusPage>;
	findByTeamId(teamId: string): Promise<StatusPage[]>;
	// collection fetch
	// update
	updateById(id: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage>;
	// delete
	deleteById(id: string, teamId: string): Promise<StatusPage>;
	// other
	removeMonitorFromStatusPages(monitorId: string): Promise<number>;
}
