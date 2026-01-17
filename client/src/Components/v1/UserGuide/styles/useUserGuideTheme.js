/**
 * Hook to get theme-aware styles for UserGuide components
 * Uses MUI's theme system from Checkmate
 */
import { useTheme } from "@mui/material/styles";
import { typography, spacing, brandColors } from "./theme";

/**
 * Returns theme-aware styles for UserGuide components
 */
export const useUserGuideTheme = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const colors = {
		text: {
			primary: theme.palette.primary.contrastText,
			secondary: theme.palette.primary.contrastTextSecondary,
			muted: theme.palette.primary.contrastTextTertiary,
			white: "#ffffff",
		},
		brand: brandColors,
		border: {
			default: theme.palette.primary.lowContrast,
		},
		background: {
			white: isDark ? "#1a1a1a" : "#ffffff",
			alt: theme.palette.primaryBackground.main,
			code: isDark ? "#1C2130" : "#f3f4f6",
			sidebar: theme.palette.primaryBackground.main,
			hover: isDark ? "#2a2a2a" : "#f3f4f6",
		},
	};

	const border = {
		radius: "4px",
		default: `1px solid ${colors.border.default}`,
	};

	const imageStyles = {
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

	const chipStyles = {
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

	const componentStyles = {
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

	return {
		colors,
		typography,
		spacing,
		border,
		imageStyles,
		chipStyles,
		componentStyles,
		isDark,
		theme,
	};
};

export default useUserGuideTheme;
