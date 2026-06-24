import { isTokenString, isTokenURL, tokenize } from "@csstools/css-tokenizer";

// Mirrors the server check (server/src/utils/customCss.ts) so the form rejects
// the same CSS the API would.
const EXTERNAL_TARGET = /^\s*(?:https?:|\/\/)/i;

export const cssReferencesExternalResource = (css?: string | null): boolean => {
	if (typeof css !== "string" || css === "") {
		return false;
	}

	return tokenize({ css }).some(
		(token) =>
			(isTokenURL(token) || isTokenString(token)) && EXTERNAL_TARGET.test(token[4].value)
	);
};
