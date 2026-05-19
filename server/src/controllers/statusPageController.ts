import { Request, RequestHandler, Response, NextFunction } from "express";

import {
	createStatusPageBodyValidation,
	updateStatusPageBodyValidation,
	unlockBodyValidation,
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
import { StatusPageBruteForceService } from "@/service/business/statusPageBruteForceService.js";
import { buildCookieName, signUnlockToken, UNLOCK_TOKEN_TTL_SECONDS, UNLOCK_COOKIE_PATH } from "@/utils/statusPagePasswordCookie.js";

const SERVICE_NAME = "statusPageController";

export interface IStatusPageController {
	readonly serviceName: string;
	createStatusPage(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	updateStatusPage(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	getStatusPageByUrl(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	getStatusPagesByTeamId(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	deleteStatusPage(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	unlockStatusPage: RequestHandler;
	lockStatusPage: RequestHandler;
}

class StatusPageController implements IStatusPageController {
	static SERVICE_NAME = SERVICE_NAME;
	private statusPageService: IStatusPageService;
	private monitorsRepository: IMonitorsRepository;
	private settingsService: ISettingsService;
	private bruteForceService: StatusPageBruteForceService;
	constructor(
		statusPageService: IStatusPageService,
		monitorsRepository: IMonitorsRepository,
		settingsService: ISettingsService,
		bruteForceService: StatusPageBruteForceService
	) {
		this.statusPageService = statusPageService;
		this.monitorsRepository = monitorsRepository;
		this.settingsService = settingsService;
		this.bruteForceService = bruteForceService;
	}

	get serviceName() {
		return StatusPageController.SERVICE_NAME;
	}

	createStatusPage = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const body = createStatusPageBodyValidation.parse(req.body);
			if (req.file) {
				imageValidation.parse(req.file);
			}

			const teamId = requireTeamId(req?.user?.teamId);
			const userId = requireUserId(req?.user?.id);
			const statusPage = await this.statusPageService.createStatusPage(userId, teamId, req.file, req.body);

			if (body.password) {
				await this.statusPageService.setPassword(statusPage.id, body.password);
			}

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
			const body = updateStatusPageBodyValidation.parse(req.body);
			if (req.file) {
				imageValidation.parse(req.file);
			}

			const teamId = requireTeamId(req?.user?.teamId);
			const statusPageId = req.params.id as string;
			if (!statusPageId) {
				throw new AppError({ message: "Status page ID is required", status: 400 });
			}
			const statusPage = await this.statusPageService.updateStatusPage(statusPageId, teamId, req.file, req.body);
			if (statusPage === null) {
				throw new AppError({ message: "Status page not found", status: 404 });
			}

			if (body.password) {
				await this.statusPageService.setPassword(statusPage.id, body.password);
			}
			if (body.removePassword) {
				await this.statusPageService.removePassword(statusPage.id);
			}

			res.status(200).json({
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
			getStatusPageParamValidation.parse(req.params);
			getStatusPageQueryValidation.parse(req.query);

			if (!req.params.url) {
				throw new AppError({ message: "Status page URL is required", status: 400 });
			}

			const statusPage = await this.statusPageService.getStatusPageByUrl(req.params.url as string);

			// Published pages are reachable by anonymous viewers (with `req.user` undefined)
			// after they clear the password gate via the unlock cookie. Unpublished pages
			// require an authenticated owning-team user. Keep this branch gated on
			// `!isPublished` — calling requireTeamId() against an anonymous viewer would
			// throw on the protected-but-published path.
			if (!statusPage.isPublished) {
				const teamId = requireTeamId(req?.user?.teamId);
				if (statusPage.teamId !== teamId) {
					throw new AppError({ message: "Forbidden", status: 403 });
				}
			}

			const settings = await this.settingsService.getDBSettings();
			const showURL = settings.showURL;

			const monitors = await this.monitorsRepository.findByIds(statusPage.monitors);
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
			return res.status(200).json({
				success: true,
				msg: "Status page retrieved successfully",
				data: {
					statusPage,
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

	unlockStatusPage = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
		try {
			const { url } = getStatusPageParamValidation.parse(req.params);
			const { password } = unlockBodyValidation.parse(req.body);
			const ip = req.ip ?? "unknown";
			const ipHash = this.bruteForceService.hashIp(ip);

			// verifyPassword performs the single DB fetch and always returns the
			// statusPageId when the page exists (regardless of password match),
			// so the controller no longer needs a separate prefetch for the
			// brute-force check.
			const result = await this.statusPageService.verifyPassword(url, password);

			if (result.statusPageId && (await this.bruteForceService.isLockedOut(result.statusPageId, ipHash))) {
				return res.status(429).json({
					success: false,
					msg: "Too many failed attempts. Please try again later.",
				});
			}

			if (result.ok && result.statusPageId) {
				const { jwtSecret } = this.settingsService.getSettings();
				const token = signUnlockToken({ statusPageId: result.statusPageId, passwordVersion: result.passwordVersion! }, jwtSecret);
				await this.bruteForceService.clear(result.statusPageId, ipHash);
				// `req.secure` is `false` behind a reverse proxy unless `app.set("trust proxy", …)`
				// is configured. Fall back to NODE_ENV so production always gets the Secure flag
				// regardless of proxy configuration. Dev/test stay insecure so cookies work over HTTP.
				const isSecureRequest = req.secure || process.env.NODE_ENV === "production";
				res.cookie(buildCookieName(result.statusPageId), token, {
					httpOnly: true,
					sameSite: "lax",
					secure: isSecureRequest,
					path: UNLOCK_COOKIE_PATH,
					maxAge: UNLOCK_TOKEN_TTL_SECONDS * 1000,
				});
				return res.status(204).send();
			}

			if (result.statusPageId) {
				await this.bruteForceService.recordFailure(result.statusPageId, ipHash);
				if (await this.bruteForceService.isLockedOut(result.statusPageId, ipHash)) {
					return res.status(429).json({
						success: false,
						msg: "Too many failed attempts. Please try again later.",
					});
				}
			}

			// requiresPassword:true tells the client's 401 interceptor that this is a
			// password challenge (not an expired session) so it should NOT redirect to /login.
			return res.status(401).json({ success: false, msg: "Incorrect password", requiresPassword: true });
		} catch (error) {
			next(error);
		}
	};

	lockStatusPage = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
		try {
			const { url } = getStatusPageParamValidation.parse(req.params);
			const statusPage = await this.statusPageService.findByUrlOrNull(url);
			if (statusPage) {
				res.clearCookie(buildCookieName(statusPage.id), { path: UNLOCK_COOKIE_PATH });
			}
			return res.status(204).send();
		} catch (error) {
			next(error);
		}
	};
}

export default StatusPageController;
