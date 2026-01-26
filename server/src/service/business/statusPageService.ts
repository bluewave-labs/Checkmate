import { type IStatusPagesRepository } from "@/repositories/index.js";
import { StatusPage } from "@/types/index.js";
export interface IStatusPageService {
	createStatusPage(userId: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage>;
	getStatusPageByUrl(url: string): Promise<StatusPage>;
	getStatusPagesByTeamId(teamId: string): Promise<StatusPage[]>;
	updateStatusPage(id: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage>;

	deleteStatusPage(statusPageId: string, teamId: string): Promise<StatusPage>;
}

export class StatusPageService implements IStatusPageService {
	private statusPagesRepository: IStatusPagesRepository;
	constructor(statusPagesRepository: IStatusPagesRepository) {
		this.statusPagesRepository = statusPagesRepository;
	}

	createStatusPage = async (
		userId: string,
		teamId: string,
		image: Express.Multer.File | undefined,
		data: Partial<StatusPage>
	): Promise<StatusPage> => {
		return await this.statusPagesRepository.create(userId, teamId, image, data);
	};

	getStatusPageByUrl = async (url: string): Promise<StatusPage> => {
		return await this.statusPagesRepository.findByUrl(url);
	};

	getStatusPagesByTeamId = async (teamId: string): Promise<StatusPage[]> => {
		return await this.statusPagesRepository.findByTeamId(teamId);
	};

	updateStatusPage = async (id: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage> => {
		return await this.statusPagesRepository.updateById(id, teamId, image, data);
	};

	deleteStatusPage = async (statusPageId: string, teamId: string): Promise<StatusPage> => {
		return await this.statusPagesRepository.deleteById(statusPageId, teamId);
	};
}
