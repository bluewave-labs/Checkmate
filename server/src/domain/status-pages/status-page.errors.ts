import type { ErrorDefinition } from "@/utils/AppError.js";

export const statusPageErrors = {
	notFound: { status: 404, description: "Status page not found" },
	unpublished: { status: 403, description: "Status page is unpublished and the caller is not on its team" },
	monitorNotOnPage: { status: 404, description: "Monitor not found on this status page" },
	customDomainIsHost: { status: 400, description: "The custom domain matches the instance host" },
	domainRequired: { status: 400, description: "No domain could be resolved" },
} satisfies Record<string, ErrorDefinition>;
