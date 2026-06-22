// Normalize the CSS the way a browser does before matching, so obfuscated forms
// (inline comments, CSS escapes like "\75 rl(") can't hide an external reference.
const decodeForScan = (css: string): string =>
	css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\\([0-9a-fA-F]{1,6})\s?|\\([\s\S])/g, (_match, hex: string, char: string) => {
		if (!hex) {
			return char;
		}
		const codePoint = parseInt(hex, 16);
		return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : "�";
	});

// An external reference is @import, or a resource function (url, image-set,
// image, cross-fade) whose target starts with an http(s) scheme or is
// protocol-relative. Anchoring on the start of the target keeps data: and
// relative URLs allowed, including data: SVG that embeds the SVG namespace URL.
const EXTERNAL_REFERENCE = /(?:@import\b|(?:url|image-set|-webkit-image-set|image|cross-fade|-webkit-cross-fade)\s*\(\s*['"]?\s*(?:https?:|\/\/))/i;

export const cssReferencesExternalResource = (css?: string | null): boolean => {
	if (typeof css !== "string" || css === "") {
		return false;
	}
	return EXTERNAL_REFERENCE.test(decodeForScan(css));
};
