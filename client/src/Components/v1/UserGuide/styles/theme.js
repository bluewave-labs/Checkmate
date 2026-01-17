/**
 * Design Tokens for UserGuide
 * Supports both light and dark themes via MUI theme integration
 */

// Typography (theme-independent)
export const typography = {
	fontFamily: {
		sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif",
		mono: "'Geist Mono', 'Fira Code', 'Consolas', monospace",
	},
	fontSize: {
		xs: 12,
		sm: 12,
		base: 13,
		md: 14,
		lg: 15,
		xl: 16,
		"2xl": 20,
		"3xl": 22,
		"4xl": 26,
		"5xl": 30,
	},
	lineHeight: {
		tight: 1.2,
		snug: 1.3,
		normal: 1.4,
		relaxed: 1.5,
	},
	fontWeight: {
		normal: 400,
		medium: 500,
		semibold: 600,
		bold: 700,
	},
};

// Spacing (theme-independent)
export const spacing = {
	xs: "4px",
	sm: "8px",
	md: "12px",
	lg: "16px",
	xl: "24px",
	"2xl": "32px",
	"3xl": "40px",
	"4xl": "48px",
};

// Brand colors (theme-independent) - Checkmate blue
export const brandColors = {
	primary: "#1570EF",
	primaryDark: "#1054B0",
	primaryLight: "#5BA3F5",
	success: "#17B26A",
	warning: "#F79009",
	error: "#F04438",
};

/**
 * Get theme-aware colors based on MUI theme mode
 * @param {'light' | 'dark'} mode - The current theme mode
 * @returns {Object} Theme-aware color tokens
 */
export const getColors = (mode) => {
	const isDark = mode === "dark";

	return {
		text: {
			primary: isDark ? "#ffffff" : "#1C2130",
			secondary: isDark ? "#d0d5dd" : "#475467",
			muted: isDark ? "#98a2b3" : "#667085",
			white: "#ffffff",
			whiteMuted: "rgba(255, 255, 255, 0.8)",
		},
		brand: brandColors,
		border: {
			default: isDark ? "#344054" : "#d0d5dd",
		},
		background: {
			white: isDark ? "#1a1a1a" : "#ffffff",
			alt: isDark ? "#0d0d0d" : "#f9fafb",
			code: isDark ? "#1C2130" : "#f3f4f6",
			sidebar: isDark ? "#101010" : "#ffffff",
			hover: isDark ? "#2a2a2a" : "#f3f4f6",
		},
	};
};

/**
 * Get theme-aware border styles
 * @param {'light' | 'dark'} mode - The current theme mode
 * @returns {Object} Border styles
 */
export const getBorder = (mode) => {
	const colors = getColors(mode);
	return {
		radius: "4px",
		default: `1px solid ${colors.border.default}`,
	};
};

/**
 * Get theme-aware image styles
 * @param {'light' | 'dark'} mode - The current theme mode
 * @returns {Object} Image styles
 */
export const getImageStyles = (mode) => {
	const colors = getColors(mode);
	const border = getBorder(mode);
	const isDark = mode === "dark";

	return {
		image: {
			width: "100%",
			borderRadius: border.radius,
			border: border.default,
			display: "block",
			boxShadow: isDark ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.1)",
		},
		caption: {
			fontSize: 10,
			color: colors.text.muted,
			textAlign: "center",
			fontStyle: "italic",
		},
	};
};

/**
 * Get theme-aware chip styles
 * @param {'light' | 'dark'} mode - The current theme mode
 * @returns {Object} Chip styles
 */
export const getChipStyles = (mode) => {
	const isDark = mode === "dark";

	return {
		url: {
			backgroundColor: isDark ? "rgba(21, 112, 239, 0.2)" : "rgba(21, 112, 239, 0.1)",
			color: isDark ? "#5BA3F5" : "#1570EF",
			padding: "2px 8px",
			borderRadius: "4px",
			fontFamily: typography.fontFamily.mono,
			fontSize: "0.9em",
		},
		code: {
			backgroundColor: isDark ? "#2d2d2d" : "#f3f4f6",
			color: isDark ? "#d0d5dd" : "#1C2130",
			padding: "2px 8px",
			borderRadius: "4px",
			fontFamily: typography.fontFamily.mono,
			fontSize: "0.9em",
		},
	};
};

/**
 * Get theme-aware component styles
 * @param {'light' | 'dark'} mode - The current theme mode
 * @returns {Object} Component styles
 */
export const getComponentStyles = (mode) => {
	const colors = getColors(mode);
	const border = getBorder(mode);

	return {
		card: {
			backgroundColor: colors.background.white,
			border: border.default,
			borderRadius: border.radius,
		},
		heading: {
			h2: {
				fontFamily: typography.fontFamily.sans,
				fontSize: typography.fontSize["2xl"],
				fontWeight: typography.fontWeight.semibold,
				color: colors.text.primary,
				lineHeight: typography.lineHeight.normal,
			},
			h3: {
				fontFamily: typography.fontFamily.sans,
				fontSize: typography.fontSize.lg,
				fontWeight: typography.fontWeight.semibold,
				color: colors.text.primary,
				lineHeight: typography.lineHeight.normal,
			},
		},
		paragraph: {
			fontFamily: typography.fontFamily.sans,
			fontSize: typography.fontSize.base,
			color: colors.text.primary,
			lineHeight: typography.lineHeight.relaxed,
		},
		listItem: {
			fontSize: typography.fontSize.base,
			color: colors.text.primary,
			lineHeight: typography.lineHeight.snug,
		},
	};
};

// Legacy exports for backwards compatibility (dark mode defaults)
// These will be replaced by useUserGuideTheme hook usage
export const colors = getColors("dark");
export const border = getBorder("dark");
export const imageStyles = getImageStyles("dark");
export const chipStyles = getChipStyles("dark");
export const componentStyles = getComponentStyles("dark");

// Export everything as a single theme object (dark mode default)
export const theme = {
	colors,
	typography,
	spacing,
	border,
	imageStyles,
	chipStyles,
	componentStyles,
};

export default theme;
