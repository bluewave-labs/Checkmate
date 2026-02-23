import { Request, Response, NextFunction } from "express";

import { createStatusPageBodyValidation, getStatusPageParamValidation, getStatusPageQueryValidation, imageValidation } from "@/validation/joi.js";
import { AppError } from "@/utils/AppError.js";
import { requireTeamId, requireUserId } from "@/controllers/controllerUtils.js";
import { IStatusPageService } from "@/service/business/statusPageService.js";
import { IMonitorsRepository } from "@/repositories/index.js";
import { ISettingsService } from "@/service/system/settingsService.js";
import { ParseBoolean } from "@/utils/utils.js";
import { NormalizeData } from "@/utils/dataUtils.js";

const SERVICE_NAME = "statusPageController";

class StatusPageController {
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

	createStatusPage = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await createStatusPageBodyValidation.validateAsync(req.body);
			await imageValidation.validateAsync(req.file);

			const teamId = requireTeamId(req?.user?.teamId);
			const userId = requireUserId(req?.user?.id);
			const statusPage = await this.statusPageService.createStatusPage(userId, teamId, req.file, req.body);

			return res.status(200).json({
				success: true,
				msg: "Status page created successfully",
				data: statusPage,
			});
		} catch (error) {
			next(error);
		}
	};

	updateStatusPage = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await createStatusPageBodyValidation.validateAsync(req.body);
			await imageValidation.validateAsync(req.file);
			const teamId = requireTeamId(req?.user?.teamId);
			const statusPageId = req.params.id as string;
			if (!statusPageId) {
				throw new AppError({ message: "Status page ID is required", status: 400 });
			}
			const statusPage = await this.statusPageService.updateStatusPage(statusPageId, teamId, req.file, req.body);
			return res.status(200).json({
				success: true,
				msg: "Status page updated successfully",
				data: statusPage,
			});
		} catch (error) {
			next(error);
		}
	};

	getStatusPageByUrl = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await getStatusPageParamValidation.validateAsync(req.params);
			await getStatusPageQueryValidation.validateAsync(req.query);

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
					const { url, port, secret, notifications, ...rest } = monitor;
					return { ...rest, checks: normalizedChecks };
				}
				return { ...monitor, checks: normalizedChecks };
			});
			return res.status(200).json({
				success: true,
				msg: "Status page retrieved successfully",
				data: { statusPage, monitors: normalizedMonitors },
			});
		} catch (error) {
			next(error);
		}
	};
	getStatusPagesByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = requireTeamId(req.user?.teamId);
			const statusPages = await this.statusPageService.getStatusPagesByTeamId(teamId);

			return res.status(200).json({
				success: true,
				msg: "Status pages retrieved successfully",
				data: statusPages,
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
