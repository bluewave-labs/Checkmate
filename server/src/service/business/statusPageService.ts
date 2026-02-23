import StatusPageModel from "@/db/models/StatusPage.js";
import { type IStatusPagesRepository } from "@/repositories/index.js";
import { StatusPage } from "@/types/index.js";
import { AppError } from "@/utils/AppError.js";

const MAX_CUSTOM_CSS_LENGTH = 10000;

export interface IStatusPageService {
	createStatusPage(userId: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage>;
	getStatusPageByUrl(url: string): Promise<StatusPage>;
	getStatusPagesByTeamId(teamId: string): Promise<StatusPage[]>;
	updateStatusPage(
		id: string, 
		teamId: string, 
		image: Express.Multer.File | undefined, 
		data: Partial<StatusPage>
	): Promise<StatusPage>;

	deleteStatusPage(statusPageId: string, teamId: string): Promise<StatusPage>;
}

export class StatusPageService implements IStatusPageService {
	private statusPagesRepository: IStatusPagesRepository;
	constructor(statusPagesRepository: IStatusPagesRepository) {
		this.statusPagesRepository = statusPagesRepository;
	}

	private sanitizeCSS(css:string): string{
		return css 
		.replace(/<\/style>/gi,"") 
		.replace(/<script.*?>.*?<\/script>/gi,"");
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

	updateStatusPage = async (
		id: string, 
		teamId: string, 
		image: Express.Multer.File | undefined, 
		data: Partial<StatusPage>
	): Promise<StatusPage> => {

		if(typeof data.customCSS === "string"){
			if(data.customCSS.length > MAX_CUSTOM_CSS_LENGTH){
				throw new AppError({
					message:"Custom CSS exceeds maximum length",
					status:400
				});
			}
			data.customCSS = this.sanitizeCSS(data.customCSS);
		}

		return await this.statusPagesRepository.updateById(id, teamId, image, data);
	};

	deleteStatusPage = async (statusPageId: string, teamId: string): Promise<StatusPage> => {
		return await this.statusPagesRepository.deleteById(statusPageId, teamId);
	};
}
