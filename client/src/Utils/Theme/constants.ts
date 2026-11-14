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

export const INPUT_BASE_HEIGHT = 30; // Height for inputs/controls
export const SCROLLBAR_SIZE = 8;
export const HOVER = {
	DARKEN: 0.06, // This is a coefficient for darkening function
	ROW: 0.025, // Overlay alpha for hoverable rows and cards
	CONTROL: 0.05, // Stronger overlay for controls nested inside a hoverable row
} as const;

// Exact component measurements that theme.spacing / LAYOUT can't express.
// RADIUS_PX feeds both theme.shape.borderRadius and RADIUS.SM.
export const RADIUS_PX = 4;

export const RADIUS = {
	XS: "2px", // elements nested inside a 4px container (segmented options)
	SM: `${RADIUS_PX}px`, // buttons, cards, inputs, menus, modals, table frames, controls
	TAB: "9px 9px 0 0", // folder tab top corners
} as const;

export const CONTROL_HEIGHT = {
	SM: 28,
} as const;

export const BADGE = {
	HEIGHT: 24, // status and value badges
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
	SEGMENT: "2px", // between segmented control options
	CONTROL: "8px", // between dropdowns, filters and selectors in a toolbar row
	SELECTED: "6px", // between chips of selected values under a multi-select
} as const;

export const PADDING = {
	BUTTON_SM: "6px 12px",
	ICON_BUTTON: "4px",
	CHIP: "0 10px 0 13px", // text sits 14px in (13 + 1px border), same as a Select
	MENU_ITEM: "5px 12px", // with the 2px item margin, text sits 14px in like a Select
	TOOLTIP: "8px 12px",
	TAB: "7px 14px 8px",
	TAB_ROW_INSET: "10px",
	SEGMENT: "0 16px", // segmented control options
	SEGMENT_GROUP: "3px", // inset between the segmented container and its options
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

// Width of each icon link in the page header group (help, docs, API)
export const HEADER_LINK_WIDTH = 32;

// Selected-items list under a multi-select: a count header and one row per pick
export const SELECTED_LIST = {
	HEADER_HEIGHT: 32,
	ROW_HEIGHT: 34,
} as const;

// Same height whatever the header cells contain
export const TABLE_HEAD_HEIGHT = 36;

// Tag badge tint: background alpha and text darken/lighten shift
export const TAG_TINT = {
	BG_LIGHT: 0.14,
	BG_DARK: 0.2,
	TEXT_SHIFT: 0.35,
} as const;

// Minimal motion: colour changes on hover only
export const MOTION = {
	HOVER: "150ms ease",
} as const;
