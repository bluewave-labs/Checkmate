import bcrypt from "bcryptjs";
import { type IStatusPagesRepository } from "@/repositories/index.js";
import { ISettingsService } from "@/service/system/settingsService.js";
import { DEFAULT_STATUS_PAGE_THEME, DEFAULT_STATUS_PAGE_THEME_MODE, StatusPage, STATUSPAGE_PASSWORD_MIN_LENGTH } from "@/types/index.js";
import { AppError } from "@/utils/AppError.js";

export interface VerifyPasswordResult {
	ok: boolean;
	statusPageId?: string;
	passwordVersion?: number;
}

export interface IStatusPageService {
	createStatusPage(userId: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage>;
	getStatusPageByUrl(url: string): Promise<StatusPage>;
	getStatusPagesByTeamId(teamId: string): Promise<StatusPage[]>;
	updateStatusPage(id: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage>;

	deleteStatusPage(statusPageId: string, teamId: string): Promise<StatusPage>;

	setPassword(id: string, password: string): Promise<void>;
	removePassword(id: string): Promise<void>;
	verifyPassword(url: string, password: string): Promise<VerifyPasswordResult>;
	findByUrlOrNull(url: string): Promise<StatusPage | null>;
}

const DUMMY_BCRYPT_HASH = "$2a$10$AAAAAAAAAAAAAAAAAAAAA.uUTjLBh/jvbm0F0xrTQqQpAYP0n.qZS";

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

	setPassword = async (id: string, password: string): Promise<void> => {
		if (!password || password.length < STATUSPAGE_PASSWORD_MIN_LENGTH) {
			throw new AppError({
				message: `Password must be at least ${STATUSPAGE_PASSWORD_MIN_LENGTH} characters`,
				status: 400,
			});
		}
		const salt = bcrypt.genSaltSync(10);
		const hash = bcrypt.hashSync(password, salt);
		await this.statusPagesRepository.updatePasswordHash(id, hash);
	};

	removePassword = async (id: string): Promise<void> => {
		await this.statusPagesRepository.updatePasswordHash(id, null);
	};

	verifyPassword = async (url: string, password: string): Promise<VerifyPasswordResult> => {
		const statusPage = await this.statusPagesRepository.findByUrlWithSecret(url);
		if (!statusPage.passwordHash) {
			await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
			return { ok: false, statusPageId: statusPage.id };
		}
		const ok = await bcrypt.compare(password, statusPage.passwordHash);
		if (!ok) return { ok: false, statusPageId: statusPage.id };
		return { ok: true, statusPageId: statusPage.id, passwordVersion: statusPage.passwordVersion };
	};

	findByUrlOrNull = async (url: string): Promise<StatusPage | null> => {
		try {
			return await this.statusPagesRepository.findByUrl(url);
		} catch (error) {
			if (error instanceof AppError && error.status === 404) return null;
			throw error;
		}
	};
}
