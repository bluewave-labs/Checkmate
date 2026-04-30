import type { SxProps, Theme } from "@mui/material/styles";
import type { StatusPageThemeTokens } from "../tokens";
import { type OverallTone, toneColor, toneSoft } from "../shared/overallStatus";
import { MONO_STACK, SANS_STACK } from "../shared/fontStacks";

export type RefinedHeatCell = "fast" | "med" | "slow" | "down" | "empty";
export type RefinedBarKind = "up" | "down" | "empty";
export type RefinedGaugeFill = "ok" | "warm" | "hot";
import { MAX_RECENT_CHECKS } from "@/Types/Monitor";

export interface RefinedStyles {
	page: SxProps<Theme>;
	top: SxProps<Theme>;
	brand: SxProps<Theme>;
	logoMono: SxProps<Theme>;
	logoImg: SxProps<Theme>;
	company: SxProps<Theme>;
	hero: SxProps<Theme>;
	statusDot: (tone: OverallTone) => SxProps<Theme>;
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
	heatmapCell: (kind: RefinedHeatCell) => SxProps<Theme>;
	histogram: SxProps<Theme>;
	bar: (kind: RefinedBarKind, heightPct: number) => SxProps<Theme>;
	chartStats: SxProps<Theme>;
	infra: SxProps<Theme>;
	infraEmpty: SxProps<Theme>;
	gauge: SxProps<Theme>;
	gaugeLabel: SxProps<Theme>;
	gaugeValue: SxProps<Theme>;
	gaugeBar: SxProps<Theme>;
	gaugeFill: (level: RefinedGaugeFill, widthPct: number) => SxProps<Theme>;
	gaugeSub: SxProps<Theme>;
	footer: SxProps<Theme>;
}

const cardShadow = "0 1px 2px rgba(10, 16, 32, 0.06), 0 6px 18px rgba(10, 16, 32, 0.08)";
const cardShadowHover =
	"0 2px 4px rgba(16, 24, 40, 0.06), 0 10px 24px rgba(16, 24, 40, 0.06)";

const pillBase = {
	fontSize: 10,
	textTransform: "uppercase" as const,
	letterSpacing: "0.08em",
	padding: "2px 8px",
	borderRadius: "999px",
	fontWeight: 600,
};

export const refinedStyles = (
	tokens: StatusPageThemeTokens,
	_isDark: boolean
): RefinedStyles => {
	const heatCellBg: Record<RefinedHeatCell, string> = {
		fast: tokens.up,
		med: `color-mix(in srgb, ${tokens.up} 60%, #ffffff 40%)`,
		slow: tokens.warn,
		down: tokens.down,
		empty: tokens.border,
	};

	const barBg: Record<RefinedBarKind, string> = {
		up: tokens.up,
		down: tokens.down,
		empty: tokens.border,
	};

	const gaugeFillBg: Record<RefinedGaugeFill, string> = {
		ok: tokens.up,
		warm: tokens.warn,
		hot: tokens.down,
	};

	return {
		page: {
			flex: "1 0 auto",
			maxWidth: 960,
			width: "100%",
			mx: "auto",
			p: "48px 20px 80px",
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
			mb: "28px",
		},
		brand: {
			display: "flex",
			alignItems: "center",
			gap: "10px",
			fontWeight: 600,
			letterSpacing: "-0.01em",
			color: tokens.text,
		},
		logoMono: {
			width: 28,
			height: 28,
			borderRadius: "8px",
			background: tokens.up,
			display: "grid",
			placeItems: "center",
			color: "#fff",
			fontWeight: 700,
			fontSize: 13,
		},
		logoImg: { maxHeight: 32, maxWidth: 120, objectFit: "contain" },
		company: { fontSize: 14 },

		hero: {
			background: tokens.surface,
			border: `1px solid ${tokens.border}`,
			borderRadius: tokens.radius,
			padding: "22px 24px",
			display: "flex",
			alignItems: "center",
			gap: "16px",
			boxShadow: cardShadow,
			mb: "20px",
		},
		statusDot: (tone) => ({
			width: 10,
			height: 10,
			borderRadius: "50%",
			background: toneColor(tone, tokens),
			boxShadow: `0 0 0 4px ${toneSoft(tone, tokens)}`,
			flexShrink: 0,
		}),
		statusCopy: { flex: 1, minWidth: 0 },
		heroTitle: {
			m: 0,
			mb: "2px",
			fontSize: 17,
			fontWeight: 600,
			letterSpacing: "-0.01em",
			color: tokens.text,
		},
		heroSub: { m: 0, color: tokens.textMuted, fontSize: 13 },
		heroIcon: (tone) => ({
			color: toneColor(tone, tokens),
			display: "flex",
			alignItems: "center",
		}),

		chartSwitchWrap: { display: "flex", justifyContent: "flex-end", mb: "12px" },
		chartSwitch: {
			display: "inline-flex",
			border: `1px solid ${tokens.border}`,
			borderRadius: "8px",
			background: tokens.surface,
			p: "3px",
			gap: "2px",
		},
		chartSwitchButton: (active) => ({
			border: 0,
			background: active ? tokens.upSoft : "transparent",
			fontFamily: "inherit",
			fontSize: 11,
			padding: "5px 14px",
			cursor: "pointer",
			color: active ? tokens.up : tokens.textMuted,
			borderRadius: "5px",
			transition: "background 0.15s ease, color 0.15s ease",
			fontWeight: active ? 600 : 500,
			"&:hover": { color: active ? tokens.up : tokens.text },
		}),

		monitorList: {
			listStyle: "none",
			m: 0,
			p: 0,
			display: "flex",
			flexDirection: "column",
			gap: "12px",
		},
		card: {
			background: tokens.surface,
			border: `1px solid ${tokens.border}`,
			borderRadius: tokens.radius,
			boxShadow: cardShadow,
			overflow: "hidden",
			position: "relative",
			transition: "transform 0.15s, box-shadow 0.15s",
			"&:hover": { transform: "translateY(-1px)", boxShadow: cardShadowHover },
		},
		cardRow: {
			display: "grid",
			gridTemplateColumns: "1fr auto",
			alignItems: "center",
			gap: "16px",
			p: "16px 20px",
		},
		cardLeft: { minWidth: 0 },
		monitorName: {
			fontWeight: 600,
			fontSize: 14,
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
			mt: "4px",
			flexWrap: "wrap",
		},
		pill: {
			...pillBase,
			color: tokens.textMuted,
			border: `1px solid ${tokens.border}`,
		},
		pillHardware: {
			...pillBase,
			color: tokens.up,
			border: `1px solid ${tokens.border}`,
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
			fontWeight: 600,
			padding: "4px 10px",
			borderRadius: "999px",
			whiteSpace: "nowrap",
			background: toneSoft(tone, tokens),
			color: toneColor(tone, tokens),
		}),

		heatmap: {
			padding: "0 20px 16px",
			display: "grid",
			gridTemplateColumns: `repeat(${MAX_RECENT_CHECKS}, 1fr)`,
			gap: "3px",
			height: 42,
		},
		heatmapCell: (kind) => ({
			borderRadius: "2px",
			background: heatCellBg[kind],
			opacity: kind === "empty" ? 0.4 : 1,
			transition: "transform 0.15s",
			"&:hover": { transform: "scaleY(1.15)" },
		}),

		histogram: {
			padding: "0 20px",
			display: "grid",
			gridTemplateColumns: `repeat(${MAX_RECENT_CHECKS}, 1fr)`,
			gap: "3px",
			alignItems: "flex-end",
			height: 42,
		},
		bar: (kind, heightPct) => ({
			background: barBg[kind],
			borderRadius: "2px",
			minHeight: 3,
			opacity: kind === "empty" ? 0.4 : 1,
			height: `${heightPct}%`,
		}),
		chartStats: {
			padding: "0 20px 16px",
			fontSize: 11,
			color: tokens.textMuted,
			fontVariantNumeric: "tabular-nums",
		},

		infra: {
			padding: "14px 20px 18px",
			display: "grid",
			gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
			gap: "12px",
		},
		infraEmpty: {
			padding: "14px 20px 18px",
			color: tokens.textMuted,
			fontSize: 13,
		},
		gauge: {
			border: `1px solid ${tokens.border}`,
			borderRadius: "10px",
			p: "12px 14px",
			background: tokens.bg,
		},
		gaugeLabel: {
			fontSize: 11,
			color: tokens.textMuted,
			textTransform: "uppercase",
			letterSpacing: "0.08em",
			fontWeight: 600,
		},
		gaugeValue: {
			fontSize: 20,
			fontWeight: 600,
			letterSpacing: "-0.01em",
			mt: "2px",
			fontVariantNumeric: "tabular-nums",
			color: tokens.text,
		},
		gaugeBar: {
			height: 4,
			background: tokens.border,
			borderRadius: "2px",
			overflow: "hidden",
			mt: "8px",
		},
		gaugeFill: (level, widthPct) => ({
			display: "block",
			height: "100%",
			background: gaugeFillBg[level],
			borderRadius: "2px",
			transition: "width 0.6s",
			width: `${Math.max(0, Math.min(100, widthPct))}%`,
		}),
		gaugeSub: {
			fontSize: 11,
			color: tokens.textMuted,
			mt: "6px",
			fontVariantNumeric: "tabular-nums",
		},

		footer: {
			textAlign: "center",
			color: tokens.textMuted,
			fontSize: 12,
			mt: "40px",
			"& a": {
				color: tokens.up,
				textDecoration: "underline",
				textUnderlineOffset: "3px",
				fontWeight: 600,
				"&:hover": { color: tokens.upStrong || tokens.up },
			},
		},
	};
};
