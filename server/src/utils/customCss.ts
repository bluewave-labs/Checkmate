import { isTokenString, isTokenURL, tokenize } from "@csstools/css-tokenizer";

// Absolute http(s) or protocol-relative target; data: and relative URLs stay allowed.
const EXTERNAL_TARGET = /^\s*(?:https?:|\/\/)/i;

// Tokenizing resolves comments, escapes, and line continuations so obfuscated
// targets can't hide. url-tokens cover url(); string-tokens cover @import and image-set().
export const cssReferencesExternalResource = (css?: string | null): boolean => {
	if (typeof css !== "string" || css === "") {
		return false;
	}

	return tokenize({ css }).some((token) => (isTokenURL(token) || isTokenString(token)) && EXTERNAL_TARGET.test(token[4].value));
};
