import { serializeError, type SerializedError } from "@/utils/serializedError.js";

const REDACTED = "[REDACTED]";
const MAX_DEPTH = 6;

const SENSITIVE_KEY = /pass(word)?|secret|token|authorization|cookie|api[-_]?key|webhook/i;

// userinfo in any URL, up to the last @ before the path
const URL_CREDENTIALS = /(\b[a-z][a-z0-9+.-]*:\/\/)[^\s/?#]*@/gi;

const SECRET_URL_PATHS = [
	/(hooks\.slack\.com\/services\/)[^\s"'<>]+/gi,
	/(discord(?:app)?\.com\/api\/webhooks\/)[^\s"'<>]+/gi,
	/(\.webhook\.office\.com\/)[^\s"'<>]+/gi,
	/(api\.telegram\.org\/bot)[^\s/"'<>]+/gi,
];

export const redactString = (value: string): string =>
	SECRET_URL_PATHS.reduce((acc, pattern) => acc.replace(pattern, `$1${REDACTED}`), value.replace(URL_CREDENTIALS, `$1${REDACTED}@`));

export const redact = (value: unknown, depth = 0): unknown => {
	if (typeof value === "string") return redactString(value);
	if (value === null || typeof value !== "object" || depth >= MAX_DEPTH) return value;
	if (value instanceof Date) return value;
	if (value instanceof Error) return redact(serializeError(value), depth + 1);
	if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
	const toJSON: unknown = Reflect.get(value, "toJSON");
	if (typeof toJSON === "function") return redact(toJSON.call(value), depth + 1);
	return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, SENSITIVE_KEY.test(key) ? REDACTED : redact(item, depth + 1)]));
};

export const redactRecord = (record: Record<string, unknown>, depth = 0): Record<string, unknown> =>
	Object.fromEntries(Object.entries(record).map(([key, item]) => [key, SENSITIVE_KEY.test(key) ? REDACTED : redact(item, depth + 1)]));

export const redactError = (error: SerializedError): SerializedError => ({
	...error,
	message: redactString(error.message),
	...(error.stack && { stack: redactString(error.stack) }),
	...(error.details && { details: redactRecord(error.details) }),
	...(error.address && { address: redactString(error.address) }),
	...(error.cause && { cause: redactError(error.cause) }),
	...(error.errors && { errors: error.errors.map(redactError) }),
});
