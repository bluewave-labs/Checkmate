// Keep in sync with server/src/utils/heartbeatSlug.ts and server/src/domain/heartbeat/heartbeat.type.ts
export const HEARTBEAT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // lowercase, digits, single inner hyphens
export const HEARTBEAT_SLUG_MAX_LENGTH = 64;
const HEARTBEAT_SLUG_FALLBACK = "heartbeat";

// "Nightly Backup (prod)" → "nightly-backup-prod"
export const toHeartbeatSlug = (name: string): string => {
	const slug = name
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "") // strip the accents NFKD split off
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, HEARTBEAT_SLUG_MAX_LENGTH)
		.replace(/-+$/, ""); // the cut can leave a trailing hyphen
	return slug || HEARTBEAT_SLUG_FALLBACK;
};
