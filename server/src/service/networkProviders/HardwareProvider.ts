import { IStatusProvider } from "@/service/networkProviders/IStatusProvider.js";
import { CaptureSmartPayload, CheckContext, HardwareSmartResult, HardwareStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { Monitor, MonitorType } from "@/domain/monitors/monitor.type.js";
import { HttpProvider } from "@/service/networkProviders/HttpProvider.js";
import { AppError, internalError } from "@/utils/AppError.js";
import { smartTimeoutMs } from "@/domain/storage/smart-schedule.js";

const SERVICE_NAME = "HardwareProvider";
const SMART_ERROR_METRIC = "smart";

const smartFailure = (reason: string): HardwareSmartResult => ({
	errors: [{ metric: [SMART_ERROR_METRIC], err: `SMART request failed: ${reason}` }],
});

export class HardwareProvider implements IStatusProvider<HardwareStatusPayload> {
	readonly type = "hardware";
	constructor(private httpProvider: HttpProvider) {}

	supports(type: MonitorType) {
		return type === "hardware";
	}

	async handle(monitor: Monitor, ctx?: CheckContext): Promise<MonitorStatusResponse<HardwareStatusPayload>> {
		const { url } = monitor;
		try {
			if (!url) throw new Error("URL is required for Hardware monitor");
			// The pipeline sets ctx.smartUrl when a SMART fetch is due. Both requests run at once, but the check waits for
			// both, so the SMART timeout is capped well under the check interval (see smartTimeoutMs).
			const [status, smart] = await Promise.all([
				this.httpProvider.handle<HardwareStatusPayload>(monitor, ctx),
				ctx?.smartUrl ? this.fetchSmart(monitor, ctx.smartUrl, ctx) : Promise.resolve(undefined),
			]);
			if (smart && status.payload && typeof status.payload === "object") {
				status.payload.smart = smart;
			}
			return status;
		} catch (err: unknown) {
			throw new AppError(internalError, {
				message: err instanceof Error ? err.message : "Error performing Hardware request",
				service: SERVICE_NAME,
				details: { url: monitor.url },
			});
		}
	}

	// Never throws and never changes the monitor's status: a failed SMART fetch is recorded as a check error.
	// Returns undefined for a Capture that predates per-drive SMART, which is skipped rather than reported.
	private fetchSmart = async (monitor: Monitor, smartUrl: string, ctx: CheckContext): Promise<HardwareSmartResult | undefined> => {
		// The monitor's match rules and custom up codes describe the metrics endpoint, not this one
		const smartMonitor: Monitor = { ...monitor, url: smartUrl, method: "GET", useAdvancedMatching: false, jsonPath: undefined, customUpCodes: [] };
		try {
			// No retry: a SMART request that times out is tried again at the next SMART interval
			const response = await this.httpProvider.handle<CaptureSmartPayload>(smartMonitor, ctx, {
				timeoutMs: smartTimeoutMs(monitor.interval),
				retryLimit: 0,
			});
			if (!response.status) return smartFailure(response.message);
			const payload = response.payload;
			if (!payload || typeof payload !== "object") return smartFailure("response is not JSON");
			if (!Array.isArray(payload.data)) return undefined;
			return { drives: payload.data, errors: Array.isArray(payload.errors) ? payload.errors : [] };
		} catch (err: unknown) {
			return smartFailure(err instanceof Error ? err.message : String(err));
		}
	};
}
