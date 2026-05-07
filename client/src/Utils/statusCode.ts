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
	t: TranslateFn,
	fallback: string = "N/A"
): string => {
	if (code == null) return fallback;
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
