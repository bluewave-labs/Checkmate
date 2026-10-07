import type { ErrorDefinition } from "@/utils/AppError.js";

export const proxyErrors = {
	notFound: { status: 404, description: "Proxy not found" },
	nameTaken: { status: 409, description: "A proxy with that name already exists" },
	inUseByMonitors: { status: 409, description: "Proxy is in use by monitors" },
	isGlobalProxy: { status: 409, description: "Proxy is set as the global proxy" },
} satisfies Record<string, ErrorDefinition>;
