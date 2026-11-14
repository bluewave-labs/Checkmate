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

export const INPUT_BASE_HEIGHT = 34; // Height for inputs/controls (VerifyWise: 34px)
export const SCROLLBAR_SIZE = 8;
export const HOVER = {
	DARKEN: 0.06, // This is a coefficient for darkening function
	ROW: 0.025, // Overlay alpha for hoverable rows and cards
	CONTROL: 0.05, // Stronger overlay for controls nested inside a hoverable row
} as const;

// VerifyWise component tokens. The spec gives exact pixel values, and
// theme.spacing (base 2) / LAYOUT cannot express odd ones such as 9px or 14px,
// so component measurements are named here instead of written inline.
export const RADIUS = {
	SM: "2px", // buttons, cards, inputs, menus, modals, table frames
	SEARCH: "8px", // the search field above a list
	TAB: "9px 9px 0 0", // folder tab top corners
	PILL: "999px", // status pills, filter chips, badges
} as const;

// Medium controls use INPUT_BASE_HEIGHT (34)
export const CONTROL_HEIGHT = {
	SM: 28,
	CHIP: 30,
} as const;

export const BADGE = {
	HEIGHT: 24, // status and value pills
	TAG_HEIGHT: 22, // category tags
	PADDING: "1px 8px",
	DOT: 6,
	DOT_GAP: "6px",
} as const;

export const ICON_SIZE = {
	SM: 14,
	TAB: 15,
	MD: 16,
} as const;
export const ICON_STROKE = 1.5;

export const GAP = {
	ICON: "8px", // icon to label (sidebar items, tabs)
	CHIP: "4px", // label to chevron inside a filter chip
	TAB: "3px", // between folder tabs
} as const;

export const PADDING = {
	BUTTON_SM: "6px 12px",
	ICON_BUTTON: "4px",
	CHIP: "4px 10px 4px 12px",
	MENU_ITEM: "4px 6px",
	TOOLTIP: "8px 12px",
	TAB: "7px 14px 8px",
	TAB_ROW_INSET: "10px",
	TABLE_HEAD: "9px 14px",
	TABLE_CELL: "10px 14px",
	TABLE_CELL_X: "14px",
	DIALOG_SECTION: "16px 24px",
	DIALOG_SECTION_TOP: "16px",
	DIALOG_FOOTER: "12px 24px",
	DIALOG_BOX: "20px",
} as const;

export const FOCUS_RING = {
	WIDTH: 2,
	OFFSET: 1,
	INSET_OFFSET: "-2px",
} as const;

export const FONT_WEIGHT = {
	REGULAR: 400,
	MEDIUM: 500,
	SEMIBOLD: 600,
} as const;

export const LINE_HEIGHT = {
	TIGHT: 1,
	HEADING: 1.3,
	TITLE: 1.4,
	BODY: 1.5,
} as const;

export const FILTER_MENU_MIN_WIDTH = 180;
