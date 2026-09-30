import { RequestHandler } from "express";
import { Handler, requireTeamId } from "@/api/controllers/controllerUtils.js";
import { updateAppSettingsBodyValidation } from "@/api/validation/settingsValidation.js";
import { sendTestEmailBodyValidation } from "@/api/validation/notificationValidation.js";
import { AppError } from "@/utils/AppError.js";
import { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { IEmailService } from "@/service/emailService.js";
import { IProxiesService } from "@/domain/proxies/proxy.service.js";
import { IEgressStateService } from "@/domain/egress/egress-state.service.js";
import { Settings } from "@/domain/app-settings/app-settings.type.js";
import { INotificationsService } from "@/domain/notifications/notification.service.js";

const SERVICE_NAME = "SettingsController";

export interface ISettingsController {
	getAppSettings: RequestHandler;
	updateAppSettings: RequestHandler;
	sendTestEmail: RequestHandler;
}

class SettingsController implements ISettingsController {
	private settingsService: ISettingsService;
	private emailService: IEmailService;
	private proxiesService: IProxiesService;
	private egressStateService: IEgressStateService;
	private notificationsService: INotificationsService;
	constructor(
		settingsService: ISettingsService,
		emailService: IEmailService,
		proxiesService: IProxiesService,
		egressStateService: IEgressStateService,
		notificationsService: INotificationsService
	) {
		this.settingsService = settingsService;
		this.emailService = emailService;
		this.proxiesService = proxiesService;
		this.egressStateService = egressStateService;
		this.notificationsService = notificationsService;
	}

	buildAppSettings = async (dbSettings: Settings) => {
		const sanitizedSettings: Record<string, unknown> = { ...dbSettings };
		delete sanitizedSettings.version;
		delete sanitizedSettings.jwtSecret;
		const globalProxy =
			dbSettings.globalProxyEnabled && dbSettings.globalProxyId ? await this.proxiesService.getProxySummary(dbSettings.globalProxyId) : null;
		const returnSettings: Record<string, unknown | null> = {
			pagespeedKeySet: false,
			emailPasswordSet: false,
			globalProxy,
			settings: null,
		};

		if (typeof sanitizedSettings.pagespeedApiKey !== "undefined") {
			returnSettings.pagespeedKeySet = true;
			delete sanitizedSettings.pagespeedApiKey;
		}
		if (typeof sanitizedSettings.systemEmailPassword !== "undefined") {
			returnSettings.emailPasswordSet = true;
			delete sanitizedSettings.systemEmailPassword;
		}
		returnSettings.settings = sanitizedSettings;
		return returnSettings;
	};

	getAppSettings: Handler = async (req, res) => {
		const dbSettings = await this.settingsService.getDBSettings();
		const data = await this.buildAppSettings(dbSettings);
		res.json({ success: true, msg: "App settings fetched successfully", data });
	};

	updateAppSettings: Handler = async (req, res) => {
		const validatedBody = updateAppSettingsBodyValidation.parse(req.body);
		if (validatedBody.globalProxyId) {
			const proxy = await this.proxiesService.getProxySummary(validatedBody.globalProxyId);
			if (!proxy) {
				throw new AppError({ message: "Referenced proxy does not exist", status: 422 });
			}
		}

		const previousSettings = await this.settingsService.getDBSettings();
		if (validatedBody.egressNotifications && validatedBody.egressNotifications.length > 0) {
			// Only the caller's team's notifications can be selected; anything else is treated as not found.
			const teamId = requireTeamId(req.user?.teamId);
			const requestedIds = [...new Set(validatedBody.egressNotifications)];
			const teamNotifications = await this.notificationsService.findNotificationsByTeamId(teamId);
			const foundIds = new Set(teamNotifications.map((notification) => notification.id));
			const missing = requestedIds.filter((id) => !foundIds.has(id));
			if (missing.length > 0) {
				throw new AppError({ message: `Referenced notification does not exist: ${missing.join(", ")}`, status: 422 });
			}
		}

		const updatedSettings = await this.settingsService.updateDbSettings(validatedBody);

		// Switching the egress check on or off starts from a clean state: no degraded episode, no pending recovery job
		if (validatedBody.egressCheckEnabled !== undefined && validatedBody.egressCheckEnabled !== previousSettings.egressCheckEnabled) {
			await this.egressStateService.reset();
		}

		const data = await this.buildAppSettings(updatedSettings);
		res.json({ success: true, msg: "App settings updated successfully", data });
	};

	sendTestEmail: Handler = async (req, res) => {
		const { to, ...transportConfig } = sendTestEmailBodyValidation.parse(req.body);
		const subject = "This is a test email from Checkmate";
		const context = { testName: "Monitoring System" };

		const html = await this.emailService.buildEmail("testEmailTemplate", context);
		if (!html) {
			throw new AppError({ message: "Failed to build email template.", status: 500, service: SERVICE_NAME, method: "sendTestEmail" });
		}
		let messageId: string;
		try {
			messageId = await this.emailService.sendEmail(to, subject, html, transportConfig);
		} catch (error: unknown) {
			// Surface the underlying SMTP failure: diagnosing the settings is the whole
			// point of the test email endpoint.
			throw new AppError({
				message: error instanceof AppError ? error.message : "Failed to send test email.",
				status: error instanceof AppError ? error.status : 500,
				service: SERVICE_NAME,
				method: "sendTestEmail",
				details: error instanceof AppError ? error.details : undefined,
			});
		}

		res.json({ success: true, msg: "Test email sent successfully", data: { messageId } });
	};
}

export default SettingsController;
