import type { StatusPage } from "@/types/statusPage.js";

export interface StatusPageWithSecret extends StatusPage {
	passwordHash: string | null;
	passwordVersion: number;
}

export interface IStatusPagesRepository {
	// create
	create(userId: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage>;
	// single fetch
	findByUrl(url: string): Promise<StatusPage>;
	findByUrlWithSecret(url: string): Promise<StatusPageWithSecret>;
	findByTeamId(teamId: string): Promise<StatusPage[]>;
	// collection fetch
	// update
	updateById(id: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage>;
	updatePasswordHash(id: string, hash: string | null): Promise<void>;
	// delete
	deleteById(id: string, teamId: string): Promise<StatusPage>;
	// other
	removeMonitorFromStatusPages(monitorId: string): Promise<number>;
}
