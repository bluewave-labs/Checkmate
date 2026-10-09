import type { ErrorDefinition } from "@/utils/AppError.js";

export const maintenanceWindowErrors = {
	notFound: { status: 404, description: "Maintenance window not found" },
	monitorNotOnTeam: { status: 403, description: "A monitor is not on the caller's team" },
} satisfies Record<string, ErrorDefinition>;
