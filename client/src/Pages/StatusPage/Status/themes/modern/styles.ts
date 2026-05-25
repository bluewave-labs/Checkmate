import type { SxProps, Theme } from "@mui/material/styles";
import { keyframes } from "@mui/system";
import type { StatusPageThemeTokens } from "../tokens";
import { type OverallTone, toneColor, toneSoft } from "../shared/overallStatus";
import { MONO_STACK, SANS_STACK } from "../shared/fontStacks";
import { MAX_RECENT_CHECKS } from "@/Types/Monitor";

export type ModernHeatCell = "fast" | "med" | "slow" | "down" | "empty";
export type ModernBarKind = "up" | "down" | "empty";
export type ModernGaugeFill = "ok" | "warm" | "hot";

export interface ModernStyles {
	page: SxProps<Theme>;
	top: SxProps<Theme>;
	brand: SxProps<Theme>;
	logoGrad: SxProps<Theme>;
	logoImg: SxProps<Theme>;
	hero: SxProps<Theme>;
	pulse: (tone: OverallTone) => SxProps<Theme>;
	statusCopy: SxProps<Theme>;
	heroTitle: SxProps<Theme>;
	heroSub: SxProps<Theme>;
	heroIcon: (tone: OverallTone) => SxProps<Theme>;
	chartSwitchWrap: SxProps<Theme>;
	chartSwitch: SxProps<Theme>;
	chartSwitchButton: (active: boolean) => SxProps<Theme>;
	monitorList: SxProps<Theme>;
	card: SxProps<Theme>;
	cardRow: SxProps<Theme>;
	cardLeft: SxProps<Theme>;
	monitorName: SxProps<Theme>;
	monitorMeta: SxProps<Theme>;
	pill: SxProps<Theme>;
	pillHardware: SxProps<Theme>;
	monitorUrl: SxProps<Theme>;
	badge: (tone: OverallTone) => SxProps<Theme>;
	heatmap: SxProps<Theme>;
	heatmapCell: (kind: ModernHeatCell) => SxProps<Theme>;
	histogram: SxProps<Theme>;
	bar: (kind: ModernBarKind, heightPct: number) => SxProps<Theme>;
	chartStats: SxProps<Theme>;
	infra: SxProps<Theme>;
	infraEmpty: SxProps<Theme>;
	gauge: SxProps<Theme>;
	gaugeLabel: SxProps<Theme>;
	gaugeValue: SxProps<Theme>;
	gaugeBar: SxProps<Theme>;
	gaugeFill: (level: ModernGaugeFill, widthPct: number) => SxProps<Theme>;
	gaugeSub: SxProps<Theme>;
	footer: SxProps<Theme>;
}

const lightShadow =
	"0 2px 4px rgba(16, 24, 40, 0.04), 0 12px 32px rgba(16, 24, 40, 0.06)";
const darkShadow = "0 2px 6px rgba(0, 0, 0, 0.5), 0 20px 40px rgba(0, 0, 0, 0.4)";
const lightShadowHover =
	"0 4px 8px rgba(16, 24, 40, 0.05), 0 16px 40px rgba(16, 24, 40, 0.08)";
const darkShadowHover = "0 4px 10px rgba(0, 0, 0, 0.55), 0 24px 48px rgba(0, 0, 0, 0.45)";

const pillBase = {
	fontSize: 10,
	textTransform: "uppercase" as const,
	letterSpacing: "0.08em",
	padding: "3px 9px",
	borderRadius: "999px",
	fontWeight: 600,
};

const pulseKeyframes = keyframes`
	0% { transform: scale(1); opacity: 0.5; }
	100% { transform: scale(2.4); opacity: 0; }
`;

const fadeInKeyframes = keyframes`
	to { opacity: 1; transform: translateY(0); }
`;

export const modernStyles = (
	tokens: StatusPageThemeTokens,
	isDark: boolean
): ModernStyles => {
	const cardShadow = isDark ? darkShadow : lightShadow;
	const cardHoverShadow = isDark ? darkShadowHover : lightShadowHover;

	const heatCellBg: Record<ModernHeatCell, string> = {
		fast: `linear-gradient(180deg, ${tokens.up}, ${tokens.upStrong})`,
		med: `linear-gradient(180deg, color-mix(in srgb, ${tokens.up} 70%, #ffffff 30%), ${tokens.up})`,
		slow: `linear-gradient(180deg, ${tokens.warn}, ${tokens.degraded})`,
		down: `linear-gradient(180deg, ${tokens.down}, color-mix(in srgb, ${tokens.down} 70%, #000000 30%))`,
		empty: tokens.border,
	};

	const barBg: Record<ModernBarKind, string> = {
		up: tokens.up,
		down: tokens.down,
		empty: tokens.border,
	};

	const gaugeFillBg: Record<ModernGaugeFill, string> = {
		ok: `linear-gradient(90deg, ${tokens.up}, ${tokens.upStrong})`,
		warm: `linear-gradient(90deg, ${tokens.warn}, ${tokens.degraded})`,
		hot: `linear-gradient(90deg, ${tokens.down}, color-mix(in srgb, ${tokens.down} 70%, #000000 30%))`,
	};

	return {
		page: {
			flex: "1 0 auto",
			maxWidth: 980,
			width: "100%",
			mx: "auto",
			p: "56px 20px 80px",
			fontFamily: SANS_STACK,
			fontSize: 14,
			lineHeight: 1.5,
			color: tokens.text,
			WebkitFontSmoothing: "antialiased",
		},

		top: {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			mb: "32px",
		},
		brand: {
			display: "flex",
			alignItems: "center",
			gap: "12px",
			fontWeight: 700,
			fontSize: 15,
			letterSpacing: "-0.01em",
			color: tokens.text,
		},
		logoGrad: {
			width: 32,
			height: 32,
			borderRadius: "10px",
			background: `linear-gradient(135deg, ${tokens.up}, ${tokens.upStrong})`,
			display: "grid",
			placeItems: "center",
			color: "#fff",
			fontWeight: 700,
			fontSize: 14,
			boxShadow: `0 4px 10px color-mix(in srgb, ${tokens.up} 40%, transparent)`,
		},
		logoImg: { maxHeight: 32, maxWidth: 120, objectFit: "contain" },

		hero: {
			position: "relative",
			borderRadius: "20px",
			padding: "28px 32px",
			mb: "24px",
			display: "flex",
			alignItems: "center",
			gap: "20px",
			background: tokens.surface,
			border: `1px solid ${tokens.border}`,
			boxShadow: cardShadow,
		},
		pulse: (tone) => {
			const c = toneColor(tone, tokens);
			return {
				position: "relative",
				width: 14,
				height: 14,
				borderRadius: "50%",
				background: c,
				color: c,
				flexShrink: 0,
				"&::before, &::after": {
					content: '""',
					position: "absolute",
					inset: 0,
					borderRadius: "50%",
					background: "currentColor",
					opacity: 0.5,
					animation: `${pulseKeyframes} 2s ease-out infinite`,
				},
				"&::after": { animationDelay: "1s" },
				"@media (prefers-reduced-motion: reduce)": {
					"&::before, &::after": { animation: "none" },
				},
			};
		},
		statusCopy: { flex: 1, minWidth: 0 },
		heroTitle: {
			m: 0,
			mb: "4px",
			fontSize: 22,
			fontWeight: 700,
			letterSpacing: "-0.02em",
			color: tokens.text,
		},
		heroSub: { m: 0, color: tokens.textMuted, fontSize: 13 },
		heroIcon: (tone) => ({
			color: toneColor(tone, tokens),
			display: "flex",
			alignItems: "center",
		}),

		chartSwitchWrap: { display: "flex", justifyContent: "flex-end", mb: "14px" },
		chartSwitch: {
			display: "inline-flex",
			border: `1px solid ${tokens.border}`,
			borderRadius: "999px",
			background: tokens.surface,
			p: "3px",
			gap: "2px",
		},
		chartSwitchButton: (active) => ({
			border: 0,
			background: active ? tokens.upSoft : "transparent",
			fontFamily: "inherit",
			fontSize: 11,
			padding: "6px 16px",
			cursor: "pointer",
			color: active ? tokens.up : tokens.textMuted,
			fontWeight: 600,
			textTransform: "uppercase",
			letterSpacing: "0.08em",
			transition: "background 0.2s, color 0.2s",
			borderRadius: "999px",
			"&:hover": { color: active ? tokens.up : tokens.text },
		}),

		monitorList: {
			listStyle: "none",
			m: 0,
			p: 0,
			display: "flex",
			flexDirection: "column",
			gap: "14px",
		},
		card: {
			background: tokens.surface,
			border: `1px solid ${tokens.border}`,
			borderRadius: "16px",
			boxShadow: cardShadow,
			overflow: "hidden",
			transition: "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s",
			opacity: 0,
			transform: "translateY(8px)",
			animation: `${fadeInKeyframes} 0.5s forwards`,
			"&:nth-of-type(1)": { animationDelay: "0.05s" },
			"&:nth-of-type(2)": { animationDelay: "0.1s" },
			"&:nth-of-type(3)": { animationDelay: "0.15s" },
			"&:nth-of-type(4)": { animationDelay: "0.2s" },
			"&:nth-of-type(5)": { animationDelay: "0.25s" },
			"&:nth-of-type(n+6)": { animationDelay: "0.3s" },
			"&:hover": { transform: "translateY(-2px)", boxShadow: cardHoverShadow },
			"@media (prefers-reduced-motion: reduce)": {
				animation: "none",
				opacity: 1,
				transform: "none",
			},
		},
		cardRow: {
			display: "grid",
			gridTemplateColumns: "1fr auto",
			alignItems: "center",
			gap: "20px",
			p: "18px 24px",
		},
		cardLeft: { minWidth: 0 },
		monitorName: {
			fontWeight: 600,
			fontSize: 15,
			letterSpacing: "-0.005em",
			color: tokens.text,
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
		},
		monitorMeta: {
			display: "flex",
			gap: "10px",
			alignItems: "center",
			mt: "6px",
			flexWrap: "wrap",
		},
		pill: {
			...pillBase,
			color: tokens.textMuted,
			background: tokens.bg,
		},
		pillHardware: {
			...pillBase,
			color: tokens.up,
			background: tokens.upSoft,
		},
		monitorUrl: {
			fontSize: 12,
			color: tokens.textMuted,
			fontFamily: MONO_STACK,
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
			maxWidth: 280,
		},

		badge: (tone) => ({
			fontSize: 11,
			fontWeight: 700,
			padding: "5px 12px",
			borderRadius: "999px",
			display: "inline-flex",
			alignItems: "center",
			gap: "6px",
			whiteSpace: "nowrap",
			background: toneSoft(tone, tokens),
			color: toneColor(tone, tokens),
			"&::before": {
				content: '""',
				width: 6,
				height: 6,
				borderRadius: "50%",
				background: "currentColor",
			},
		}),

		heatmap: {
			padding: "0 24px 20px",
			display: "grid",
			gridTemplateColumns: `repeat(${MAX_RECENT_CHECKS}, 1fr)`,
			gap: "3px",
			height: 46,
		},
		heatmapCell: (kind) => ({
			borderRadius: "3px",
			background: heatCellBg[kind],
			opacity: kind === "empty" ? 0.4 : 1,
			transition: "transform 0.15s",
			"&:hover": { transform: "scaleY(1.2)" },
		}),

		histogram: {
			padding: "0 24px",
			display: "grid",
			gridTemplateColumns: `repeat(${MAX_RECENT_CHECKS}, 1fr)`,
			gap: "3px",
			alignItems: "flex-end",
			height: 46,
		},
		bar: (kind, heightPct) => ({
			background: barBg[kind],
			borderRadius: "3px",
			minHeight: 4,
			opacity: kind === "empty" ? 0.4 : 1,
			height: `${heightPct}%`,
			transition: "transform 0.15s",
			"&:hover": { transform: "scaleY(1.08)" },
		}),
		chartStats: {
			padding: "0 24px 20px",
			fontSize: 11,
			color: tokens.textMuted,
			fontVariantNumeric: "tabular-nums",
			fontWeight: 600,
		},

		infra: {
			padding: "16px 24px 22px",
			display: "grid",
			gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
			gap: "14px",
		},
		infraEmpty: {
			padding: "16px 24px 22px",
			color: tokens.textMuted,
			fontSize: 13,
		},
		gauge: {
			border: `1px solid ${tokens.border}`,
			borderRadius: "14px",
			p: "14px 16px",
			background: `linear-gradient(135deg, ${tokens.bg}, ${tokens.surface})`,
		},
		gaugeLabel: {
			fontSize: 10,
			color: tokens.textMuted,
			textTransform: "uppercase",
			letterSpacing: "0.1em",
			fontWeight: 700,
		},
		gaugeValue: {
			fontSize: 26,
			fontWeight: 700,
			letterSpacing: "-0.02em",
			mt: "4px",
			fontVariantNumeric: "tabular-nums",
			color: tokens.text,
		},
		gaugeBar: {
			height: 6,
			background: tokens.border,
			borderRadius: "3px",
			overflow: "hidden",
			mt: "10px",
		},
		gaugeFill: (level, widthPct) => ({
			display: "block",
			height: "100%",
			background: gaugeFillBg[level],
			borderRadius: "3px",
			transition: "width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)",
			width: `${Math.max(0, Math.min(100, widthPct))}%`,
		}),
		gaugeSub: {
			fontSize: 11,
			color: tokens.textMuted,
			mt: "8px",
			fontVariantNumeric: "tabular-nums",
		},

		footer: {
			textAlign: "center",
			color: tokens.textMuted,
			fontSize: 12,
			mt: "48px",
			"& a": {
				color: tokens.up,
				textDecoration: "underline",
				textUnderlineOffset: "3px",
				fontWeight: 700,
				"&:hover": { color: tokens.upStrong },
			},
		},
	};
};
