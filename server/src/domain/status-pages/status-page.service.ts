import { type IStatusPagesRepository } from "@/domain/status-pages/status-page-repository.interface.js";
import { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import {
	DEFAULT_STATUS_PAGE_THEME,
	DEFAULT_STATUS_PAGE_THEME_MODE,
	PublicStatusPagePayload,
	StatusPage,
} from "@/domain/status-pages/status-page.type.js";
import { AppError } from "@/utils/AppError.js";
import { normalizeStatusPageDomain } from "@/utils/statusPageDomain.js";
import { Monitor } from "@/domain/monitors/monitor.types.js";
import { NormalizeData } from "@/utils/dataUtils.js";

export interface IStatusPageService {
	createStatusPage(userId: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage>;
	getStatusPageByUrl(url: string): Promise<StatusPage>;
	getStatusPageByCustomDomain(customDomain: string): Promise<StatusPage>;
	getStatusPagesByTeamId(teamId: string): Promise<StatusPage[]>;
	getPublicStatusPagePayload(statusPage: StatusPage, requesterTeamId: string | undefined): Promise<PublicStatusPagePayload>;
	updateStatusPage(id: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage>;

	deleteStatusPage(statusPageId: string, teamId: string): Promise<StatusPage>;
}

export class StatusPageService implements IStatusPageService {
	constructor(
		private statusPagesRepository: IStatusPagesRepository,
		private settingsService: ISettingsService,
		private monitorsRepository: IMonitorsRepository
	) {}

	private assertCustomDomainAllowed = (customDomain: string | null | undefined) => {
		if (!customDomain) {
			return;
		}

		const clientHost = normalizeStatusPageDomain(this.settingsService.getSettings().clientHost);
		if (clientHost && customDomain === clientHost) {
			throw new AppError({
				message: "Custom domain cannot match the Checkmate instance host",
				status: 400,
			});
		}
	};

	private normalizeCustomDomainInput = (data: Partial<StatusPage>): Partial<StatusPage> => {
		if (!("customDomain" in data)) {
			return data;
		}

		const customDomain = normalizeStatusPageDomain(data.customDomain);
		this.assertCustomDomainAllowed(customDomain);
		return { ...data, customDomain };
	};

	private withoutThemeFields = (data: Partial<StatusPage>): Partial<StatusPage> => {
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

	private toPublicMonitor = (monitor: Monitor, showURL: boolean) => {
		const base = {
			id: monitor.id,
			name: monitor.name,
			type: monitor.type,
			status: monitor.status,
			uptimePercentage: monitor.uptimePercentage,
			recentChecks: monitor.recentChecks,
			checks: NormalizeData(monitor.recentChecks, 10, 100),
		};

		if (showURL) {
			return {
				...base,
				url: monitor.url,
				port: monitor.port,
			};
		}
		return base;
	};

	createStatusPage = async (
		userId: string,
		teamId: string,
		image: Express.Multer.File | undefined,
		data: Partial<StatusPage>
	): Promise<StatusPage> => {
		const normalizedData = this.normalizeCustomDomainInput(this.normalizeInput(data));
		const created = await this.statusPagesRepository.create(userId, teamId, image, normalizedData);
		return this.normalizeTheme(created);
	};

	getStatusPageByUrl = async (url: string): Promise<StatusPage> => {
		const statusPage = await this.statusPagesRepository.findByUrl(url);
		return this.normalizeTheme(statusPage);
	};

	getStatusPageByCustomDomain = async (customDomain: string): Promise<StatusPage> => {
		const statusPage = await this.statusPagesRepository.findByCustomDomain(customDomain);
		return this.normalizeTheme(statusPage);
	};

	getStatusPagesByTeamId = async (teamId: string): Promise<StatusPage[]> => {
		const statusPages = await this.statusPagesRepository.findByTeamId(teamId);
		return statusPages.map((sp) => this.normalizeTheme(sp));
	};

	getPublicStatusPagePayload = async (statusPage: StatusPage, requesterTeamId: string | undefined): Promise<PublicStatusPagePayload> => {
		if (!statusPage.isPublished) {
			if (!requesterTeamId || statusPage.teamId !== requesterTeamId) {
				throw new AppError({ message: "Forbidden", status: 403 });
			}
		}

		const showURL = (await this.settingsService.getDBSettings()).showURL;
		const monitors = await this.monitorsRepository.findByIds(statusPage.monitors);
		const order = new Map(statusPage.monitors.map((id, i) => [id, i]));
		const sorted = [...monitors].sort((a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER));

		return { statusPage, monitors: sorted.map((monitor) => this.toPublicMonitor(monitor, showURL)) };
	};

	updateStatusPage = async (id: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage> => {
		const normalizedData = this.normalizeCustomDomainInput(this.normalizeInput(data));
		const updated = await this.statusPagesRepository.updateById(id, teamId, image, normalizedData);
		return this.normalizeTheme(updated);
	};

	deleteStatusPage = async (statusPageId: string, teamId: string): Promise<StatusPage> => {
		return await this.statusPagesRepository.deleteById(statusPageId, teamId);
	};
}
