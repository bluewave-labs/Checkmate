import { type IStatusPagesRepository } from "@/repositories/index.js";
import { ISettingsService } from "@/service/system/settingsService.js";
import { DEFAULT_STATUS_PAGE_THEME, DEFAULT_STATUS_PAGE_THEME_MODE, StatusPage } from "@/types/index.js";

export interface IStatusPageService {
	createStatusPage(userId: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage>;
	getStatusPageByUrl(url: string): Promise<StatusPage>;
	getStatusPagesByTeamId(teamId: string): Promise<StatusPage[]>;
	updateStatusPage(id: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage>;

	deleteStatusPage(statusPageId: string, teamId: string): Promise<StatusPage>;
}

export class StatusPageService implements IStatusPageService {
	private statusPagesRepository: IStatusPagesRepository;
	private settingsService: ISettingsService;
	constructor(statusPagesRepository: IStatusPagesRepository, settingsService: ISettingsService) {
		this.statusPagesRepository = statusPagesRepository;
		this.settingsService = settingsService;
	}

	private withoutThemeFields = (data: Partial<StatusPage>): Partial<StatusPage> => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { theme: _theme, themeMode: _themeMode, ...rest } = data;
		return rest;
	};

	private applyDefaultTheme = (statusPage: StatusPage): StatusPage => ({
		...statusPage,
		theme: DEFAULT_STATUS_PAGE_THEME,
		themeMode: DEFAULT_STATUS_PAGE_THEME_MODE,
	});

	private normalizeTheme = (statusPage: StatusPage): StatusPage =>
		this.settingsService.areStatusPageThemesEnabled() ? statusPage : this.applyDefaultTheme(statusPage);

	private normalizeInput = (data: Partial<StatusPage>): Partial<StatusPage> =>
		this.settingsService.areStatusPageThemesEnabled() ? data : this.withoutThemeFields(data);

	createStatusPage = async (
		userId: string,
		teamId: string,
		image: Express.Multer.File | undefined,
		data: Partial<StatusPage>
	): Promise<StatusPage> => {
		const created = await this.statusPagesRepository.create(userId, teamId, image, this.normalizeInput(data));
		return this.normalizeTheme(created);
	};

	getStatusPageByUrl = async (url: string): Promise<StatusPage> => {
		const statusPage = await this.statusPagesRepository.findByUrl(url);
		return this.normalizeTheme(statusPage);
	};

	getStatusPagesByTeamId = async (teamId: string): Promise<StatusPage[]> => {
		const statusPages = await this.statusPagesRepository.findByTeamId(teamId);
		return statusPages.map((sp) => this.normalizeTheme(sp));
	};

	updateStatusPage = async (id: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage> => {
		const updated = await this.statusPagesRepository.updateById(id, teamId, image, this.normalizeInput(data));
		return this.normalizeTheme(updated);
	};

	deleteStatusPage = async (statusPageId: string, teamId: string): Promise<StatusPage> => {
		return await this.statusPagesRepository.deleteById(statusPageId, teamId);
	};
}
