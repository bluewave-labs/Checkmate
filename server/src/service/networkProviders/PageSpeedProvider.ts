import { IStatusProvider } from "@/service/networkProviders/IStatusProvider.js";
import { MonitorStatusResponse, PageSpeedStatusPayload } from "@/types/network.js";
import { Monitor, MonitorType, DefaultPageSpeedStrategy } from "@/domain/monitors/monitor.type.js";
import { HttpProvider } from "@/service/networkProviders/HttpProvider.js";
import { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { ILogger } from "@/utils/logger/logger.js";
import { AppError, internalError } from "@/utils/AppError.js";

const SERVICE_NAME = "PageSpeedProvider";

export class PageSpeedProvider implements IStatusProvider<PageSpeedStatusPayload> {
	readonly type = "pagespeed";
	private logger: ILogger;

	constructor(
		private httpProvider: HttpProvider,
		private settingsService: ISettingsService,
		logger: ILogger
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
	}

	supports(type: MonitorType) {
		return type === "pagespeed";
	}

	async handle(monitor: Monitor): Promise<MonitorStatusResponse<PageSpeedStatusPayload>> {
		const { url, strategy } = monitor;
		try {
			if (!url) throw new Error("URL is required for PageSpeed monitor");
			const dbSettings = await this.settingsService.getCachedDBSettings();
			const apiKey = dbSettings?.pagespeedApiKey;
			const resolvedStrategy = strategy ?? DefaultPageSpeedStrategy;
			let pageSpeedUrl = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
				url
			)}&strategy=${encodeURIComponent(resolvedStrategy)}&category=seo&category=accessibility&category=best-practices&category=performance`;

			if (apiKey) {
				pageSpeedUrl += `&key=${apiKey}`;
			} else {
				this.logger.warn({ url }, "PageSpeed API key not found, performance may be throttled");
			}

			return await this.httpProvider.handle<PageSpeedStatusPayload>({
				...monitor,
				url: pageSpeedUrl,
			});
		} catch (err: unknown) {
			throw new AppError(internalError, {
				message: err instanceof Error ? err.message : "Error performing PageSpeed request",
				service: SERVICE_NAME,
				details: { url: monitor.url },
			});
		}
	}
}
