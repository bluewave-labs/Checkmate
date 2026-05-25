import { IStatusProvider } from "@/service/infrastructure/network/IStatusProvider.js";
import { MonitorStatusResponse, PageSpeedStatusPayload } from "@/types/network.js";
import { Monitor, MonitorType, DefaultPageSpeedStrategy } from "@/types/monitor.js";
import { HttpProvider } from "@/service/infrastructure/network/HttpProvider.js";
import { ISettingsService } from "@/service/system/settingsService.js";
import { ILogger } from "@/utils/logger.js";
import { AppError } from "@/utils/AppError.js";

export class PageSpeedProvider implements IStatusProvider<PageSpeedStatusPayload> {
	readonly type = "pagespeed";
	constructor(
		private httpProvider: HttpProvider,
		private settingsService: ISettingsService,
		private logger: ILogger
	) {}

	supports(type: MonitorType) {
		return type === "pagespeed";
	}

	async handle(monitor: Monitor): Promise<MonitorStatusResponse<PageSpeedStatusPayload>> {
		const { url, strategy } = monitor;
		try {
			if (!url) throw new Error("URL is required for PageSpeed monitor");
			const dbSettings = await this.settingsService.getDBSettings();
			const apiKey = dbSettings?.pagespeedApiKey;
			const resolvedStrategy = strategy ?? DefaultPageSpeedStrategy;
			let pageSpeedUrl = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
				url
			)}&strategy=${encodeURIComponent(resolvedStrategy)}&category=seo&category=accessibility&category=best-practices&category=performance`;

			if (apiKey) {
				pageSpeedUrl += `&key=${apiKey}`;
			} else {
				this.logger.warn({
					message: "PageSpeed API key not found, performance may be throttled",
					service: "PageSpeedProvider",
					method: "handle",
					details: { url },
				});
			}

			return await this.httpProvider.handle<PageSpeedStatusPayload>({
				...monitor,
				url: pageSpeedUrl,
			});
		} catch (err: unknown) {
			throw new AppError({
				message: err instanceof Error ? err.message : "Error performing PageSpeed request",
				service: "PageSpeedProvider",
				method: "handle",
				details: { url: monitor.url },
			});
		}
	}
}
