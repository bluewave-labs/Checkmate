export const specialCharPattern = /[!?@#$%^&*()\-_=+[\]{};:'",.<>~`|\\/]/;

// Unicode-aware name pattern (allows letters, marks, apostrophes, parentheses, hyphens, periods, spaces)
export const namePattern = /^[\p{L}\p{M}''()\-\. ]+$/u;

// Hostname (FQDN): labels of 1-63 alphanumerics/hyphens separated by dots,
// optionally prefixed with `_` for service labels (e.g. _dmarc, _imaps._tcp).
// No scheme, port, path, or whitespace. Total length ≤ 253.
export const hostnamePattern =
	/^(?=.{1,253}$)([a-zA-Z0-9_](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
