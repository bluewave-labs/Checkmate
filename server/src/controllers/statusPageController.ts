import { Request, Response, NextFunction } from "express";

import {
	createStatusPageBodyValidation,
	getStatusPageParamValidation,
	getStatusPageQueryValidation,
	imageValidation,
} from "@/validation/statusPageValidation.js";
import { AppError } from "@/utils/AppError.js";
import { requireTeamId, requireUserId } from "@/controllers/controllerUtils.js";
import { IStatusPageService } from "@/service/business/statusPageService.js";
import { IMonitorsRepository } from "@/repositories/index.js";
import { ISettingsService } from "@/service/system/settingsService.js";
import { NormalizeData } from "@/utils/dataUtils.js";
import { DEFAULT_STATUS_PAGE_THEME, DEFAULT_STATUS_PAGE_THEME_MODE, type StatusPage } from "@/types/statusPage.js";

const SERVICE_NAME = "statusPageController";

export interface IStatusPageController {
	readonly serviceName: string;
	createStatusPage(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	updateStatusPage(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	getStatusPageByUrl(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	getStatusPagesByTeamId(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	deleteStatusPage(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}

class StatusPageController implements IStatusPageController {
	static SERVICE_NAME = SERVICE_NAME;
	private statusPageService: IStatusPageService;
	private monitorsRepository: IMonitorsRepository;
	private settingsService: ISettingsService;
	constructor(statusPageService: IStatusPageService, monitorsRepository: IMonitorsRepository, settingsService: ISettingsService) {
		this.statusPageService = statusPageService;
		this.monitorsRepository = monitorsRepository;
		this.settingsService = settingsService;
	}

	get serviceName() {
		return StatusPageController.SERVICE_NAME;
	}

	// Used when STATUS_PAGE_THEMES_ENABLED is false: drop incoming theme fields
	// before persisting so an admin client can't accidentally store a value the
	// public page won't honour.
	private withoutThemeFields = (body: Record<string, unknown>): Record<string, unknown> => {
		const rest = { ...body };
		delete rest.theme;
		delete rest.themeMode;
		return rest;
	};

	// Used when STATUS_PAGE_THEMES_ENABLED is false: overwrite the stored
	// theme/themeMode with their defaults on read so callers see consistent
	// values regardless of what's in the DB. Whatever a user previously chose
	// is preserved in Mongo and resurfaces if the flag is flipped back on.
	private applyDefaultTheme = (statusPage: StatusPage): StatusPage => ({
		...statusPage,
		theme: DEFAULT_STATUS_PAGE_THEME,
		themeMode: DEFAULT_STATUS_PAGE_THEME_MODE,
	});

	createStatusPage = async (req: Request, res: Response, next: NextFunction) => {
		try {
			createStatusPageBodyValidation.parse(req.body);
			if (req.file) {
				imageValidation.parse(req.file);
			}

			const themesEnabled = this.settingsService.areStatusPageThemesEnabled();
			const body = themesEnabled ? req.body : this.withoutThemeFields(req.body);
			const teamId = requireTeamId(req?.user?.teamId);
			const userId = requireUserId(req?.user?.id);
			const statusPage = await this.statusPageService.createStatusPage(userId, teamId, req.file, body);

			return res.status(200).json({
				success: true,
				msg: "Status page created successfully",
				data: themesEnabled ? statusPage : this.applyDefaultTheme(statusPage),
			});
		} catch (error) {
			next(error);
		}
	};

	updateStatusPage = async (req: Request, res: Response, next: NextFunction) => {
		try {
			createStatusPageBodyValidation.parse(req.body);
			if (req.file) {
				imageValidation.parse(req.file);
			}

			const themesEnabled = this.settingsService.areStatusPageThemesEnabled();
			const body = themesEnabled ? req.body : this.withoutThemeFields(req.body);
			const teamId = requireTeamId(req?.user?.teamId);
			const statusPageId = req.params.id as string;
			if (!statusPageId) {
				throw new AppError({ message: "Status page ID is required", status: 400 });
			}
			const statusPage = await this.statusPageService.updateStatusPage(statusPageId, teamId, req.file, body);
			if (statusPage === null) {
				throw new AppError({ message: "Status page not found", status: 404 });
			}
			res.status(200).json({
				success: true,
				msg: "Status page updated successfully",
				data: themesEnabled ? statusPage : this.applyDefaultTheme(statusPage),
			});
		} catch (error) {
			next(error);
		}
	};

	getStatusPageByUrl = async (req: Request, res: Response, next: NextFunction) => {
		try {
			getStatusPageParamValidation.parse(req.params);
			getStatusPageQueryValidation.parse(req.query);

			if (!req.params.url) {
				throw new AppError({ message: "Status page URL is required", status: 400 });
			}

			const statusPage = await this.statusPageService.getStatusPageByUrl(req.params.url as string);

			if (!statusPage.isPublished) {
				const teamId = requireTeamId(req?.user?.teamId);
				if (statusPage.teamId !== teamId) {
					throw new AppError({ message: "Forbidden", status: 403 });
				}
			}

			const settings = await this.settingsService.getDBSettings();
			const showURL = settings.showURL;

			const monitors = await this.monitorsRepository.findByIds(statusPage.monitors);
			// Sort monitors according to the order in statusPage.monitors
			const monitorOrder = new Map(statusPage.monitors.map((id, index) => [id, index]));
			const sortedMonitors = [...monitors].sort((a, b) => {
				const orderA = monitorOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
				const orderB = monitorOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
				return orderA - orderB;
			});

			const normalizedMonitors = sortedMonitors.map((monitor) => {
				const normalizedChecks = NormalizeData(monitor.recentChecks, 10, 100);
				if (!showURL) {
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { url, port, secret, notifications, ...rest } = monitor;
					return { ...rest, checks: normalizedChecks };
				}
				return { ...monitor, checks: normalizedChecks };
			});
			const themesEnabled = this.settingsService.areStatusPageThemesEnabled();
			return res.status(200).json({
				success: true,
				msg: "Status page retrieved successfully",
				data: {
					statusPage: themesEnabled ? statusPage : this.applyDefaultTheme(statusPage),
					monitors: normalizedMonitors,
				},
			});
		} catch (error) {
			next(error);
		}
	};
	getStatusPagesByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = requireTeamId(req.user?.teamId);
			const statusPages = await this.statusPageService.getStatusPagesByTeamId(teamId);

			const themesEnabled = this.settingsService.areStatusPageThemesEnabled();
			return res.status(200).json({
				success: true,
				msg: "Status pages retrieved successfully",
				data: themesEnabled ? statusPages : statusPages.map((sp) => this.applyDefaultTheme(sp)),
			});
		} catch (error) {
			next(error);
		}
	};

	deleteStatusPage = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const statusPageId = req.params.id as string;
			if (!statusPageId) {
				throw new AppError({ message: "Status page ID is required", status: 400 });
			}
			const teamId = requireTeamId(req.user?.teamId);
			await this.statusPageService.deleteStatusPage(statusPageId, teamId);
			return res.status(200).json({
				success: true,
				msg: "Status page deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	};
}

export default StatusPageController;
