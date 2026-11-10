// SMART is fetched from Capture's /api/v1/metrics/smart on a slower cadence than the hardware metrics: smartctl runs
// one process per drive and can take ~20 s on a hung drive.
export const SMART_INTERVAL_MS = 10 * 60 * 1000;

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
