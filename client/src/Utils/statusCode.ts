import type { ValueType } from "@/Components/design-elements/StatusLabel";

export const NETWORK_ERROR_CODE = 5000;

export const NETWORK_ERROR_SUBTYPES = [
	"timeout",
	"dns",
	"refused",
	"tls",
	"reset",
	"unknown",
] as const;
export type NetworkErrorSubtype = (typeof NETWORK_ERROR_SUBTYPES)[number];

type TranslateFn = (key: string) => string;

export const isNetworkError = (code?: number | null): boolean =>
	code === NETWORK_ERROR_CODE;

const ERROR_CODE_PATTERN =
	/\b(E[A-Z_]{2,}|CERT_[A-Z_]+|UNABLE_TO_VERIFY[A-Z_]*|DEPTH_ZERO_SELF_SIGNED[A-Z_]*|SELF_SIGNED[A-Z_]*)\b/;

export const extractErrorCode = (message?: string | null): string | null => {
	if (!message) return null;
	const match = message.match(ERROR_CODE_PATTERN);
	return match ? match[1] : null;
};

export const getNetworkErrorSubtype = (message?: string | null): NetworkErrorSubtype => {
	if (!message) return "unknown";
	const m = message.toUpperCase();
	if (m.includes("ETIMEDOUT") || m.includes("TIMEOUT") || m.includes("ESOCKETTIMEDOUT"))
		return "timeout";
	if (m.includes("ENOTFOUND") || m.includes("EAI_AGAIN") || m.includes("DNS"))
		return "dns";
	if (m.includes("ECONNREFUSED")) return "refused";
	if (
		m.includes("CERT_") ||
		m.includes("UNABLE_TO_VERIFY") ||
		m.includes("DEPTH_ZERO_SELF_SIGNED") ||
		m.includes("SELF_SIGNED") ||
		m.includes("TLS") ||
		m.includes("SSL")
	)
		return "tls";
	if (m.includes("ECONNRESET")) return "reset";
	return "unknown";
};

export const formatStatusCode = (
	code: number | null | undefined,
	t: TranslateFn
): string => {
	if (isNetworkError(code)) return t("common.statusCode.down");
	return String(code);
};

export const getStatusCodeTooltip = (
	code: number | null | undefined,
	message: string | null | undefined,
	t: TranslateFn
): string | null => {
	if (!isNetworkError(code)) return null;
	const description = t(
		`common.statusCode.networkError.${getNetworkErrorSubtype(message)}`
	);
	const errorCode = extractErrorCode(message);
	return errorCode ? `${description} (${errorCode})` : description;
};

export const getStatusCodeValueType = (code: number): ValueType => {
	if (isNetworkError(code)) return "negative";
	if (code < 300) return "positive";
	if (code < 400) return "neutral";
	return "negative";
};

export interface HttpStatusCodeOption {
	id: number;
	name: string;
}

/**
 * Must stay in sync with HttpStatusCodes in server/src/domain/monitors/monitor.types.ts
 */
export const ALL_HTTP_STATUS_CODES: HttpStatusCodeOption[] = [
	{ id: 100, name: "100 - Continue" },
	{ id: 101, name: "101 - Switching Protocols" },
	{ id: 102, name: "102 - Processing" },
	{ id: 103, name: "103 - Early Hints" },
	{ id: 200, name: "200 - OK" },
	{ id: 201, name: "201 - Created" },
	{ id: 202, name: "202 - Accepted" },
	{ id: 203, name: "203 - Non-Authoritative Information" },
	{ id: 204, name: "204 - No Content" },
	{ id: 205, name: "205 - Reset Content" },
	{ id: 206, name: "206 - Partial Content" },
	{ id: 207, name: "207 - Multi-Status" },
	{ id: 208, name: "208 - Already Reported" },
	{ id: 226, name: "226 - IM Used" },
	{ id: 300, name: "300 - Multiple Choices" },
	{ id: 301, name: "301 - Moved Permanently" },
	{ id: 302, name: "302 - Found" },
	{ id: 303, name: "303 - See Other" },
	{ id: 304, name: "304 - Not Modified" },
	{ id: 305, name: "305 - Use Proxy" },
	{ id: 307, name: "307 - Temporary Redirect" },
	{ id: 308, name: "308 - Permanent Redirect" },
	{ id: 400, name: "400 - Bad Request" },
	{ id: 401, name: "401 - Unauthorized" },
	{ id: 402, name: "402 - Payment Required" },
	{ id: 403, name: "403 - Forbidden" },
	{ id: 404, name: "404 - Not Found" },
	{ id: 405, name: "405 - Method Not Allowed" },
	{ id: 406, name: "406 - Not Acceptable" },
	{ id: 407, name: "407 - Proxy Authentication Required" },
	{ id: 408, name: "408 - Request Timeout" },
	{ id: 409, name: "409 - Conflict" },
	{ id: 410, name: "410 - Gone" },
	{ id: 411, name: "411 - Length Required" },
	{ id: 412, name: "412 - Precondition Failed" },
	{ id: 413, name: "413 - Payload Too Large" },
	{ id: 414, name: "414 - URI Too Long" },
	{ id: 415, name: "415 - Unsupported Media Type" },
	{ id: 416, name: "416 - Range Not Satisfiable" },
	{ id: 417, name: "417 - Expectation Failed" },
	{ id: 418, name: "418 - I'm a Teapot" },
	{ id: 419, name: "419 - Page Expired (Laravel)" },
	{ id: 420, name: "420 - Enhance Your Calm (Twitter)" },
	{ id: 421, name: "421 - Misdirected Request" },
	{ id: 422, name: "422 - Unprocessable Entity" },
	{ id: 423, name: "423 - Locked" },
	{ id: 424, name: "424 - Failed Dependency" },
	{ id: 425, name: "425 - Too Early" },
	{ id: 426, name: "426 - Upgrade Required" },
	{ id: 428, name: "428 - Precondition Required" },
	{ id: 429, name: "429 - Too Many Requests" },
	{ id: 431, name: "431 - Request Header Fields Too Large" },
	{ id: 440, name: "440 - Login Time-out (IIS)" },
	{ id: 449, name: "449 - Retry With (IIS)" },
	{ id: 451, name: "451 - Unavailable For Legal Reasons" },
	{ id: 460, name: "460 - Client Closed Connection (AWS ELB)" },
	{ id: 463, name: "463 - X-Forwarded-For Too Large (AWS ELB)" },
	{ id: 497, name: "497 - HTTP Request Sent to HTTPS Port (NGINX)" },
	{ id: 499, name: "499 - Client Closed Request (NGINX)" },
	{ id: 500, name: "500 - Internal Server Error" },
	{ id: 501, name: "501 - Not Implemented" },
	{ id: 502, name: "502 - Bad Gateway" },
	{ id: 503, name: "503 - Service Unavailable" },
	{ id: 504, name: "504 - Gateway Timeout" },
	{ id: 505, name: "505 - HTTP Version Not Supported" },
	{ id: 506, name: "506 - Variant Also Negotiates" },
	{ id: 507, name: "507 - Insufficient Storage" },
	{ id: 508, name: "508 - Loop Detected" },
	{ id: 509, name: "509 - Bandwidth Limit Exceeded (Apache)" },
	{ id: 510, name: "510 - Not Extended" },
	{ id: 511, name: "511 - Network Authentication Required" },
	{ id: 520, name: "520 - Web Server Returned an Unknown Error (Cloudflare)" },
	{ id: 521, name: "521 - Web Server Is Down (Cloudflare)" },
	{ id: 522, name: "522 - Connection Timed Out (Cloudflare)" },
	{ id: 523, name: "523 - Origin Is Unreachable (Cloudflare)" },
	{ id: 524, name: "524 - A Timeout Occurred (Cloudflare)" },
	{ id: 525, name: "525 - SSL Handshake Failed (Cloudflare)" },
	{ id: 526, name: "526 - Invalid SSL Certificate (Cloudflare)" },
	{ id: 527, name: "527 - Railgun Error (Cloudflare)" },
	{ id: 529, name: "529 - Site is overloaded" },
	{ id: 530, name: "530 - Site is frozen (Cloudflare)" },
	{ id: 561, name: "561 - Unauthorized (AWS ELB)" },
];
