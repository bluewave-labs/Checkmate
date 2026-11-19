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
	XS_PLUS: 5,
	SM: 6,
	SM_PLUS: 7,
	MD: 8,
	LG: 10,
	XL: 12,
	XXL: 16,
	XXXL: 28,
} as const;

export const INPUT_BASE_HEIGHT = 30;
export const SCROLLBAR_SIZE = 8;
export const BADGE_HEIGHT = 24;
export const TAG_HEIGHT = 22;
export const STATUS_DOT_SIZE = 6;
export const HOVER = {
	DARKEN: 0.06, // This is a coefficient for darkening function
	ROW: 0.025, // Overlay alpha for hoverable rows and cards
	CONTROL: 0.05, // Stronger overlay for controls nested inside a hoverable row
} as const;
