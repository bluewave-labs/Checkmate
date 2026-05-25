import type { StatusPageTheme } from "@/Types/StatusPage";

export interface StatusPageThemeTokens {
	bg: string;
	surface: string;
	border: string;
	text: string;
	textMuted: string;
	up: string;
	upStrong: string;
	upSoft: string;
	degraded: string;
	degradedSoft: string;
	down: string;
	downSoft: string;
	warn: string;
	warnSoft: string;
	radius: string;
	fontFamily?: string;
	headingFontFamily?: string;
	headingWeight?: number;
	headingLetterSpacing?: string;
	chartBarRadius?: string;
	pulseStatusDot?: boolean;
	staggeredCardFadeIn?: boolean;
	conicLogo?: boolean;
	heroSize?: "default" | "large";
	cardStyle?: "card" | "hairline";
}

type ThemeVariants = { light: StatusPageThemeTokens; dark: StatusPageThemeTokens };

const refined: ThemeVariants = {
	light: {
		bg: "#f4f6fa",
		surface: "#ffffff",
		border: "#dce1ea",
		text: "#0a1020",
		textMuted: "#4b5768",
		up: "#0f8a6d",
		upStrong: "#0c7359",
		upSoft: "#d6f1e6",
		degraded: "#c2630a",
		degradedSoft: "#fde7bf",
		down: "#d11f2f",
		downSoft: "#fdd9dc",
		warn: "#e08a0b",
		warnSoft: "#fdebc5",
		radius: "12px",
	},
	dark: {
		bg: "#070b11",
		surface: "#131a24",
		border: "#253142",
		text: "#f1f5fb",
		textMuted: "#9aa7bd",
		up: "#2fd7a2",
		upStrong: "#1fb487",
		upSoft: "rgba(47,215,162,0.15)",
		degraded: "#e69138",
		degradedSoft: "rgba(230,145,56,0.18)",
		down: "#ff5b6b",
		downSoft: "rgba(255,91,107,0.18)",
		warn: "#f0a837",
		warnSoft: "rgba(240,168,55,0.18)",
		radius: "12px",
	},
};

const modern: ThemeVariants = {
	light: {
		bg: "#fafbfc",
		surface: "#ffffff",
		border: "#eceef2",
		text: "#0b1220",
		textMuted: "#6b7280",
		up: "#10a37f",
		upStrong: "#0b8a6a",
		upSoft: "#d7f3e9",
		degraded: "#d97706",
		degradedSoft: "#fef3c7",
		down: "#dc2626",
		downSoft: "#fee2e2",
		warn: "#f59e0b",
		warnSoft: "#fef3c7",
		radius: "16px",
		pulseStatusDot: true,
		staggeredCardFadeIn: true,
	},
	dark: {
		bg: "#0a0d12",
		surface: "#10151c",
		border: "#1b2430",
		text: "#e8edf5",
		textMuted: "#8a95a8",
		up: "#10a37f",
		upStrong: "#0b8a6a",
		upSoft: "rgba(16,163,127,0.18)",
		degraded: "#d97706",
		degradedSoft: "rgba(217,119,6,0.22)",
		down: "#dc2626",
		downSoft: "rgba(220,38,38,0.22)",
		warn: "#f59e0b",
		warnSoft: "rgba(245,158,11,0.2)",
		radius: "16px",
		pulseStatusDot: true,
		staggeredCardFadeIn: true,
	},
};

const bold: ThemeVariants = {
	light: {
		bg: "#f5f6f9",
		surface: "#ffffff",
		border: "#e6e8ee",
		text: "#0b1220",
		textMuted: "#6b7280",
		up: "#10a37f",
		upStrong: "#0b8a6a",
		upSoft: "rgba(16,163,127,0.12)",
		degraded: "#f59e0b",
		degradedSoft: "rgba(245,158,11,0.14)",
		down: "#f43f5e",
		downSoft: "rgba(244,63,94,0.12)",
		warn: "#f59e0b",
		warnSoft: "rgba(245,158,11,0.14)",
		radius: "18px",
		heroSize: "large",
		conicLogo: true,
	},
	dark: {
		bg: "#05070a",
		surface: "#0c1117",
		border: "#1a2330",
		text: "#eef2f7",
		textMuted: "#7a8699",
		up: "#22d3a6",
		upStrong: "#10a37f",
		upSoft: "rgba(34,211,166,0.14)",
		degraded: "#f59e0b",
		degradedSoft: "rgba(245,158,11,0.14)",
		down: "#f43f5e",
		downSoft: "rgba(244,63,94,0.16)",
		warn: "#f59e0b",
		warnSoft: "rgba(245,158,11,0.14)",
		radius: "18px",
		heroSize: "large",
		conicLogo: true,
	},
};

const editorial: ThemeVariants = {
	light: {
		bg: "#fbfaf7",
		surface: "#ffffff",
		// Darkened from mockup's #e9e4d8 (~1.3:1 on #fbfaf7) to pass WCAG AA 3:1 for UI borders.
		border: "#d4cdb8",
		text: "#1a1a1a",
		textMuted: "#6b675e",
		up: "#2c6a4f",
		upStrong: "#205239",
		upSoft: "#dfeee4",
		degraded: "#a46200",
		degradedSoft: "#f7ecd4",
		down: "#9a2a2a",
		downSoft: "#f5dede",
		warn: "#a46200",
		warnSoft: "#f7ecd4",
		radius: "6px",
		headingFontFamily: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif',
		cardStyle: "hairline",
	},
	dark: {
		bg: "#141310",
		surface: "#1c1a15",
		border: "#3a352b",
		text: "#f0ece3",
		textMuted: "#9e988a",
		up: "#6fbf96",
		upStrong: "#4fa37a",
		upSoft: "rgba(44,106,79,0.22)",
		degraded: "#d79a3b",
		degradedSoft: "rgba(164,98,0,0.22)",
		down: "#d87a7a",
		downSoft: "rgba(154,42,42,0.22)",
		warn: "#d79a3b",
		warnSoft: "rgba(164,98,0,0.22)",
		radius: "6px",
		headingFontFamily: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif',
		cardStyle: "hairline",
	},
};

export const themeTokens: Record<StatusPageTheme, ThemeVariants> = {
	refined,
	modern,
	bold,
	editorial,
};
