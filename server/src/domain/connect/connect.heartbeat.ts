import type { ILogger } from "@/utils/logger/logger.js";
import type { ConnectEnrollment } from "@/domain/connect/connect.type.js";

const HEARTBEAT_INTERVAL_MS = 60_000;
const HEARTBEAT_TIMEOUT_MS = 10_000;

type HeartbeatOptions = {
	version: string;
	tunnelConnected: () => boolean;
	isHealthy: () => Promise<boolean>;
	log: ILogger;
};

// Runs whenever the installation is enrolled, regardless of remote access. The
// cloud alerts on silence, so an unhealthy installation deliberately sends
// nothing.
export class ConnectHeartbeat {
	private enrollment: ConnectEnrollment | null = null;
	private timer: NodeJS.Timeout | null = null;
	private lastOk: boolean | null = null;

	constructor(private options: HeartbeatOptions) {}

	start = (enrollment: ConnectEnrollment) => {
		this.stop();
		this.enrollment = enrollment;
		this.timer = setInterval(() => void this.beat(), HEARTBEAT_INTERVAL_MS);
		this.timer.unref();
		void this.beat();
	};

	stop = () => {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
		this.enrollment = null;
		this.lastOk = null;
	};

	beat = async () => {
		const { log, version, tunnelConnected, isHealthy } = this.options;
		try {
			if (!this.enrollment) return;
			const { connectUrl, agentId, token } = this.enrollment;
			if (!(await isHealthy())) {
				this.report(false, "Connect heartbeat paused: database unavailable");
				return;
			}

			// The host was validated against the enrollment allowlist, so this
			// cannot be steered anywhere else.
			const url = new URL(connectUrl.replace(/^wss:/, "https:"));
			url.pathname = "/api/heartbeat";
			url.search = "";

			const response = await fetch(url, {
				method: "POST",
				headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
				body: JSON.stringify({ agentId, agentVersion: version, tunnelConnected: tunnelConnected() }),
				signal: AbortSignal.timeout(HEARTBEAT_TIMEOUT_MS),
				redirect: "error",
			});
			this.report(response.ok, response.ok ? "Connect heartbeat reporting" : `Connect heartbeat rejected (${response.status})`);
		} catch (error) {
			if (this.lastOk !== false) log.warn({ err: error }, "Connect heartbeat unreachable");
			this.lastOk = false;
		}
	};

	private report = (ok: boolean, message: string) => {
		if (ok !== this.lastOk) this.options.log.info(message);
		this.lastOk = ok;
	};
}
