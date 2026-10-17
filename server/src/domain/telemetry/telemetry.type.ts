import type { DeploymentType, QueueMode } from "@/domain/app-settings/app-settings.type.js";

export const DEFAULT_TELEMETRY_URL = "https://checkmate-telemetry.bluewave-labs.workers.dev/v1/heartbeat";

export type TelemetryPayload = {
	instanceId: string;
	version: string;
	deployment: DeploymentType;
	queueMode: QueueMode;
	nodeVersion: string;
	os: NodeJS.Platform;
	arch: string;
};
