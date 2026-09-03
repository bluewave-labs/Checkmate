export const SPACING = {
	XXS: 0.25,
	XS: 0.5,
	SM: 1,
	MD: 1.5,
	LG: 2,
	XL: 2.5,
	XXL: 3,
} as const;

export const LAYOUT = {
	XXS: 2,
	XS: 4,
	SM: 6,
	MD: 8,
	LG: 10,
	XL: 12,
	XXL: 16,
} as const;

/**
 * Shared height for anything that can sit in a row with something else -
 * buttons, inputs, selects, pickers, toggles, tabs, icon buttons. One number so
 * they share a baseline instead of drifting 2px apart.
 */
export const CONTROL_HEIGHT = 32;

/**
 * Width of a square-ish icon-only control that sits in a header strip - wider
 * than CONTROL_HEIGHT so the icon has breathing room either side of the
 * dividers between them.
 */
export const ICON_CONTROL_WIDTH = 36;

export const HOVER = {
	DARKEN: 0.06, // This is a coefficient for darkening function
	ROW: 0.025, // Overlay alpha for hoverable rows and cards
	CONTROL: 0.05, // Stronger overlay for controls nested inside a hoverable row
} as const;
