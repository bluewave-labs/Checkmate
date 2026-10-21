import type { HttpStatusCode } from "@/domain/monitors/monitor.type.js";

export const timeRequest = async <T>(operation: () => Promise<T>): Promise<{ response: T | null; responseTime: number; error: unknown }> => {
	const start = process.hrtime.bigint();
	try {
		const response = await operation();
		const elapsedMs = Math.round(Number(process.hrtime.bigint() - start) / 1_000_000);
		return { response, responseTime: elapsedMs, error: null };
	} catch (error) {
		const elapsedMs = Math.round(Number(process.hrtime.bigint() - start) / 1_000_000);
		return { response: null, responseTime: elapsedMs, error };
	}
};

export const isStatusUp = (statusCode: number | undefined, customUpCodes: HttpStatusCode[] = []): boolean => {
	if (statusCode === undefined) return false;
	return (statusCode >= 200 && statusCode < 300) || customUpCodes.includes(statusCode);
};

// Errno codes that can only arise once the target's own stack has answered: it refused the connection, reset
// an established one, or got far enough into a TLS handshake to present a certificate. Every other failure —
// a timeout, an unreachable network, a name that would not resolve — looks the same whether the target is
// down or the instance has lost its egress, so those are left for the egress probe to decide.
const PEER_ANSWERED_ERROR_CODES: ReadonlySet<string> = new Set([
	"ECONNREFUSED",
	"ECONNRESET",
	"EPIPE",
	"EPROTO",
	"CERT_HAS_EXPIRED",
	"CERT_NOT_YET_VALID",
	"DEPTH_ZERO_SELF_SIGNED_CERT",
	"SELF_SIGNED_CERT_IN_CHAIN",
	"UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
	"UNABLE_TO_VERIFY_LEAF_SIGNATURE",
	"ERR_TLS_CERT_ALTNAME_INVALID",
	"ERR_SSL_WRONG_VERSION_NUMBER",
]);

export const peerAnsweredFromError = (error: unknown): boolean => {
	const code = (error as NodeJS.ErrnoException | undefined)?.code;
	return typeof code === "string" && PEER_ANSWERED_ERROR_CODES.has(code);
};
