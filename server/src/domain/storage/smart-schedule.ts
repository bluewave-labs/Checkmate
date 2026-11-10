// SMART is fetched from Capture's /api/v1/metrics/smart on a slower cadence than the hardware metrics: smartctl runs
// one process per drive and can take ~20 s on a hung drive.
export const SMART_INTERVAL_MS = 10 * 60 * 1000;

// The check is built only once both the metrics and the SMART request finish, so a slow SMART read delays that check.
// The SMART timeout is kept well under the check interval: half of it, and never more than SMART_MAX_TIMEOUT_MS.
// A drive that hangs longer (Capture allows ~20 s per hung drive) is recorded as a SMART error for that fetch.
export const SMART_MAX_TIMEOUT_MS = 60_000;
const SMART_TIMEOUT_INTERVAL_FRACTION = 0.5;

export const smartTimeoutMs = (intervalMs: number | undefined): number =>
	intervalMs && intervalMs > 0 ? Math.min(SMART_MAX_TIMEOUT_MS, Math.floor(intervalMs * SMART_TIMEOUT_INTERVAL_FRACTION)) : SMART_MAX_TIMEOUT_MS;

const METRICS_PATH = "/api/v1/metrics";
const SMART_PATH = `${METRICS_PATH}/smart`;

// The SMART endpoint sits next to the metrics endpoint. Only derive it from a URL that points at the metrics endpoint
// (a trailing slash and query string are kept); for anything else return null rather than guess.
export const deriveSmartUrl = (metricsUrl: string | undefined): string | null => {
	if (!metricsUrl) return null;
	let url: URL;
	try {
		url = new URL(metricsUrl);
	} catch {
		return null;
	}
	const path = url.pathname.replace(/\/+$/, "");
	if (!path.endsWith(METRICS_PATH)) return null;
	url.pathname = `${path.slice(0, -METRICS_PATH.length)}${SMART_PATH}`;
	return url.toString();
};

// smartCheckedAt is the epoch ms of the last SMART attempt, successful or not, so a failing host is not retried on
// every check. A timestamp in the future (the clock moved back) counts as due rather than pausing SMART until then.
export const isSmartDue = (smartCheckedAt: number | undefined, now: number): boolean =>
	smartCheckedAt === undefined || smartCheckedAt > now || now - smartCheckedAt >= SMART_INTERVAL_MS;
