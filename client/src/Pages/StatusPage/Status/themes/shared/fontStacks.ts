// No "Inter" here: its webfont was never self-hosted, so once the Google Fonts
// import went it resolved to a fallback anyway. Listing it only made the stack
// look intentional on machines that happen to have Inter installed.
export const SANS_STACK =
	'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const BOLD_SANS_STACK = `ui-sans-serif, ${SANS_STACK}`;

export const SERIF_STACK = 'Georgia, "Iowan Old Style", "Palatino Linotype", serif';

export const EDITORIAL_SECONDARY_SANS_STACK =
	'-apple-system, "Helvetica Neue", Arial, sans-serif';

export const MONO_STACK = "ui-monospace, Menlo, monospace";
