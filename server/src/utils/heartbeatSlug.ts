import { HEARTBEAT_SLUG_MAX_LENGTH } from "@/domain/heartbeat/heartbeat.type.js";

const HEARTBEAT_SLUG_FALLBACK = "heartbeat";

export const toHeartbeatSlug = (name: string): string => {
	const slug = name
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, HEARTBEAT_SLUG_MAX_LENGTH)
		.replace(/-+$/, "");
	return slug || HEARTBEAT_SLUG_FALLBACK;
};
