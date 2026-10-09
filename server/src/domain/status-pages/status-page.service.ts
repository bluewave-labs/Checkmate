import { type IIncidentsRepository } from "@/domain/incidents/incident.repository.interface.js";
import type { Incident, PublicIncident } from "@/domain/incidents/incident.type.js";
import { type IStatusPagesRepository } from "@/domain/status-pages/status-page-repository.interface.js";
import { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { IChecksRepository } from "@/domain/checks/check.repository.interface.js";
import type { DailyCheckBucket } from "@/domain/checks/check.type.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import {
	DEFAULT_STATUS_PAGE_THEME,
	DEFAULT_STATUS_PAGE_THEME_MODE,
	PublicStatusPagePayload,
	STATUS_PAGE_RANGE_DAYS,
	StatusPage,
	StatusPageRange,
} from "@/domain/status-pages/status-page.type.js";
import { AppError } from "@/utils/AppError.js";
import { normalizeStatusPageDomain } from "@/utils/statusPageDomain.js";
import { Monitor } from "@/domain/monitors/monitor.type.js";
import { statusPageErrors } from "@/domain/status-pages/status-page.errors.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface IStatusPageService {
	createStatusPage(userId: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage>;
	getStatusPageByUrl(url: string): Promise<StatusPage>;
	getStatusPageByCustomDomain(customDomain: string): Promise<StatusPage>;
	getStatusPagesByTeamId(teamId: string): Promise<StatusPage[]>;
	getPublicStatusPageByUrl(url: string, requesterTeamId: string | undefined, range: StatusPageRange): Promise<PublicStatusPagePayload>;
	getPublicStatusPagePayload(statusPage: StatusPage, range: StatusPageRange): Promise<PublicStatusPagePayload>;
	getPublicMonitorIncidents(url: string, monitorId: string, date: string, requesterTeamId?: string): Promise<PublicIncident[]>;
	updateStatusPage(id: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage>;

	deleteStatusPage(statusPageId: string, teamId: string): Promise<StatusPage>;
}
const SERVICE_NAME = "StatusPageService";

export class StatusPageService implements IStatusPageService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(
		private statusPagesRepository: IStatusPagesRepository,
		private settingsService: ISettingsService,
		private monitorsRepository: IMonitorsRepository,
		private checksRepository: IChecksRepository,
		private incidentsRepository: IIncidentsRepository
	) {}

	private assertCustomDomainAllowed = (customDomain: string | null | undefined) => {
		if (!customDomain) {
			return;
		}

		const clientHost = normalizeStatusPageDomain(this.settingsService.getSettings().clientHost);
		if (clientHost && customDomain === clientHost) {
			throw new AppError(statusPageErrors.customDomainIsHost, { service: SERVICE_NAME, method: "assertCustomDomainAllowed" });
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

	private toPublicIncident = (incident: Incident): PublicIncident => ({
		id: incident.id,
		monitorId: incident.monitorId,
		status: incident.status,
		startTime: incident.startTime,
		endTime: incident.endTime,
		resolutionType: incident.resolutionType,
		message: incident.message ?? null,
		statusCode: incident.statusCode ?? null,
		createdAt: incident.createdAt,
	});

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

	getPublicStatusPageByUrl = async (
		url: string,
		requesterTeamId: string | undefined,
		range: StatusPageRange = "latest"
	): Promise<PublicStatusPagePayload> => {
		const statusPage = await this.getStatusPageByUrl(url);
		if (!statusPage.isPublished) {
			if (!requesterTeamId || statusPage.teamId !== requesterTeamId) {
				throw new AppError(statusPageErrors.unpublished, { service: SERVICE_NAME, method: "getPublicStatusPageByUrl" });
			}
		}
		return this.getPublicStatusPagePayload(statusPage, range);
	};

	getPublicStatusPagePayload = async (statusPage: StatusPage, range: StatusPageRange = "latest"): Promise<PublicStatusPagePayload> => {
		const dbSettings = await this.settingsService.getDBSettings();
		const showURL = dbSettings.showURL;
		const monitors = await this.monitorsRepository.findByIds(statusPage.monitors, { recentChecks: range === "latest" ? "all" : "latestHardware" });
		const order = new Map(statusPage.monitors.map((id, i) => [id, i]));
		const sorted = [...monitors].sort((a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER));

		if (range === "latest") {
			return { statusPage, monitors: sorted.map((monitor) => this.toPublicMonitor(monitor, showURL)) };
		}

		const days = STATUS_PAGE_RANGE_DAYS[range];
		const bucketTimezone = statusPage.timezone ?? "Etc/UTC";
		const buckets = await this.checksRepository.getDailyStatusBuckets(statusPage.monitors, days, bucketTimezone);
		const bucketsByMonitor = buckets.reduce((grouped, bucket) => {
			const monitorBuckets = grouped.get(bucket.monitorId);
			if (monitorBuckets) {
				monitorBuckets.push(bucket);
			} else {
				grouped.set(bucket.monitorId, [bucket]);
			}
			return grouped;
		}, new Map<string, DailyCheckBucket[]>());

		return {
			statusPage,
			range,
			bucketTimezone,
			checkTTLDays: dbSettings.checkTTL,
			monitors: sorted.map((monitor) => ({
				...this.toPublicMonitor(monitor, showURL),
				dailyChecks: bucketsByMonitor.get(monitor.id) ?? [],
			})),
		};
	};

	getPublicMonitorIncidents = async (url: string, monitorId: string, date: string, requesterTeamId?: string): Promise<PublicIncident[]> => {
		const statusPage = await this.getStatusPageByUrl(url);

		// Ensure the status page is public or the requester is the owner
		if (!statusPage.isPublished) {
			if (!requesterTeamId || statusPage.teamId !== requesterTeamId) {
				throw new AppError(statusPageErrors.unpublished, { service: SERVICE_NAME, method: "getPublicMonitorIncidents" });
			}
		}

		// Ensure the requested monitor actually belongs to this status page
		if (!statusPage.monitors.includes(monitorId)) {
			throw new AppError(statusPageErrors.monitorNotOnPage, { service: SERVICE_NAME, method: "getPublicMonitorIncidents" });
		}

		const tz = statusPage.timezone ?? "Etc/UTC";
		const dateStart = dayjs.tz(date, tz).startOf("day").toDate();
		const dateEnd = dayjs.tz(date, tz).endOf("day").toDate();

		const incidents = await this.incidentsRepository.findByMonitorIdAndDate(monitorId, statusPage.teamId, dateStart, dateEnd);
		return incidents.map(this.toPublicIncident);
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
