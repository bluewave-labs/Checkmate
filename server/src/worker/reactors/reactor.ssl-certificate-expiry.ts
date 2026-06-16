import sslChecker from "ssl-checker";
import { INotificationsService } from "@/domain/notifications/notification.service.js";
import { Monitor } from "@/domain/monitors/monitor.types.js";
import { ILogger } from "@/utils/logger.js";
import { fetchMonitorCertificate, getCertificateDaysRemaining } from "@/utils/ssl.js";
import { IMonitorReactor } from "@/worker/reactors/reactor.interface.js";
import { MonitorEvaluation } from "@/worker/worker.interface.js";

const SERVICE_NAME = "SslCertificateExpiryReactor";

const SSL_EXPIRY_WARNING_DAYS = [14, 7, 1] as const;
type SslExpiryWarningDay = (typeof SSL_EXPIRY_WARNING_DAYS)[number];

export class SslCertificateExpiryReactor implements IMonitorReactor {
	readonly name = "ssl-certificate-expiry";
	readonly blocking = false;

	private sentWarnings = new Set<string>();

	constructor(
		private notificationService: INotificationsService,
		private logger: ILogger
	) {}

	private isHttpsMonitor(monitor: Monitor) {
		if (!monitor.url) return false;

		try {
			return new URL(monitor.url).protocol === "https:";
		} catch {
			return false;
		}
	}

	private getWarningDay(daysRemaining: number): SslExpiryWarningDay | null {
		return SSL_EXPIRY_WARNING_DAYS.find((day) => day === daysRemaining) ?? null;
	}

	private getDedupeKey(monitor: Monitor, expiryDate: Date, warningDay: SslExpiryWarningDay) {
		return `${monitor.id}:${expiryDate.toISOString()}:${warningDay}`;
	}

	react = async (evaluation: MonitorEvaluation) => {
		const monitor = evaluation.monitor;

		if (!monitor.id) return;
		if (!this.isHttpsMonitor(monitor)) return;

		try {
			const certificate = await fetchMonitorCertificate(sslChecker, monitor);

			const expiryDate = new Date(certificate.validTo);
			const daysRemaining = getCertificateDaysRemaining(certificate.validTo);

			const warningDay = this.getWarningDay(daysRemaining);

			if (!warningDay) return;

			const dedupeKey = this.getDedupeKey(monitor, expiryDate, warningDay);

			if (this.sentWarnings.has(dedupeKey)) return;

			const sent = await this.notificationService.handleCertificateExpiryNotification(monitor, expiryDate, warningDay);

			if (sent) {
				this.sentWarnings.add(dedupeKey);
			}
		} catch (error: unknown) {
			this.logger.warn({
				service: SERVICE_NAME,
				method: "react",
				message: `Failed to check SSL certificate expiry for monitor ${monitor.id}: ${error instanceof Error ? error.message : String(error)}`,
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
	};
}
