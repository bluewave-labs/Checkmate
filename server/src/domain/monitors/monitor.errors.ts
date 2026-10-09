import type { ErrorDefinition } from "@/utils/AppError.js";

export const monitorErrors = {
	notFound: { status: 404, description: "Monitor not found" },
	notUptimeMonitor: { status: 400, description: "The monitor is not an uptime monitor" },
	notHardwareMonitor: { status: 400, description: "The monitor is not a hardware monitor" },
	notPageSpeedMonitor: { status: 400, description: "The monitor is not a pagespeed monitor" },
	notDockerMonitor: { status: 400, description: "The monitor is not a Docker monitor" },
	nothingToExport: { status: 400, description: "No monitors to export" },
	invalidNotificationIds: { status: 400, description: "One or more monitor or notification ids are invalid" },
	notificationNotOnTeam: { status: 403, description: "A notification belongs to another team" },
	dockerTlsKeyRequired: { status: 422, description: "A TLS Docker host needs a key" },
	captureSecretRequired: { status: 422, description: "A hardware monitor needs a Capture API secret" },
	encryptionKeyMissing: { status: 422, description: "Docker TLS credentials need ENCRYPTION_KEY set on the server" },
} satisfies Record<string, ErrorDefinition>;
