import type { SxProps, Theme } from "@mui/material/styles";
import type { StatusPageThemeTokens } from "../tokens";
import { type OverallTone, toneColor, toneSoft } from "../shared/overallStatus";
import {
	EDITORIAL_SECONDARY_SANS_STACK,
	MONO_STACK,
	SERIF_STACK,
} from "../shared/fontStacks";
import { MAX_RECENT_CHECKS } from "@/Types/Monitor";

export type EditorialHeatCell = "fast" | "med" | "slow" | "down" | "empty";
export type EditorialBarKind = "up" | "down" | "empty";
export type EditorialGaugeFill = "ok" | "warm" | "hot";

export interface EditorialStyles {
	page: SxProps<Theme>;
	top: SxProps<Theme>;
	brandWrap: SxProps<Theme>;
	logoImg: SxProps<Theme>;
	brandEyebrow: SxProps<Theme>;
	brandTitle: SxProps<Theme>;
	statusLine: SxProps<Theme>;
	statusDot: (tone: OverallTone) => SxProps<Theme>;
	dateline: SxProps<Theme>;
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
	heatmapCell: (kind: EditorialHeatCell) => SxProps<Theme>;
	histogram: SxProps<Theme>;
	bar: (kind: EditorialBarKind, heightPct: number) => SxProps<Theme>;
	chartStats: SxProps<Theme>;
	infra: SxProps<Theme>;
	infraEmpty: SxProps<Theme>;
	gauge: SxProps<Theme>;
	gaugeLabel: SxProps<Theme>;
	gaugeValue: SxProps<Theme>;
	gaugeBar: SxProps<Theme>;
	gaugeFill: (level: EditorialGaugeFill, widthPct: number) => SxProps<Theme>;
	gaugeSub: SxProps<Theme>;
	footer: SxProps<Theme>;
}

export const editorialStyles = (
	tokens: StatusPageThemeTokens,
	_isDark: boolean
): EditorialStyles => {
	const heatCellBg: Record<EditorialHeatCell, string> = {
		fast: tokens.up,
		med: `color-mix(in srgb, ${tokens.up} 60%, ${tokens.bg})`,
		slow: tokens.warn,
		down: tokens.down,
		empty: tokens.border,
	};

	const barBg: Record<EditorialBarKind, string> = {
		up: tokens.up,
		down: tokens.down,
		empty: tokens.border,
	};

	const gaugeFillBg: Record<EditorialGaugeFill, string> = {
		ok: tokens.up,
		warm: tokens.warn,
		hot: tokens.down,
	};

	return {
		page: {
			flex: "1 0 auto",
			maxWidth: 760,
			width: "100%",
			mx: "auto",
			p: "64px 24px 96px",
			fontFamily: SERIF_STACK,
			fontSize: 15,
			lineHeight: 1.6,
			color: tokens.text,
			WebkitFontSmoothing: "antialiased",
		},

		top: {
			display: "flex",
			alignItems: "flex-end",
			justifyContent: "space-between",
			mb: "48px",
			borderBottom: `2px solid ${tokens.text}`,
			pb: "18px",
		},
		brandWrap: { display: "flex", flexDirection: "column" },
		logoImg: { maxHeight: 48, maxWidth: 160, objectFit: "contain", mb: "8px" },
		brandEyebrow: {
			m: 0,
			fontSize: 11,
			textTransform: "uppercase",
			letterSpacing: "0.3em",
			fontWeight: 700,
			color: tokens.textMuted,
			fontFamily: EDITORIAL_SECONDARY_SANS_STACK,
		},
		brandTitle: {
			mt: "6px",
			mb: 0,
			fontSize: 40,
			fontWeight: 700,
			letterSpacing: "-0.02em",
			lineHeight: 1,
			color: tokens.text,
		},

		statusLine: {
			fontSize: 22,
			fontWeight: 400,
			m: 0,
			mb: "8px",
			letterSpacing: "-0.01em",
			lineHeight: 1.35,
			color: tokens.text,
			fontFamily: SERIF_STACK,
		},
		statusDot: (tone) => ({
			display: "inline-block",
			width: 10,
			height: 10,
			borderRadius: "50%",
			background: toneColor(tone, tokens),
			mr: "10px",
			verticalAlign: "middle",
		}),
		dateline: {
			fontFamily: EDITORIAL_SECONDARY_SANS_STACK,
			fontSize: 11,
			textTransform: "uppercase",
			letterSpacing: "0.12em",
			color: tokens.textMuted,
			m: 0,
			mb: "56px",
		},

		chartSwitchWrap: {
			display: "flex",
			justifyContent: "flex-end",
			mb: "20px",
			fontFamily: EDITORIAL_SECONDARY_SANS_STACK,
		},
		chartSwitch: {
			display: "inline-flex",
			border: `1px solid ${tokens.text}`,
			"& > button + button": { borderLeft: `1px solid ${tokens.text}` },
		},
		chartSwitchButton: (active) => ({
			fontFamily: "inherit",
			fontSize: 10,
			textTransform: "uppercase",
			letterSpacing: "0.2em",
			padding: "6px 14px",
			border: 0,
			background: active ? tokens.text : "transparent",
			color: active ? tokens.bg : tokens.text,
			cursor: "pointer",
			fontWeight: 700,
		}),

		monitorList: {
			listStyle: "none",
			m: 0,
			p: 0,
			display: "flex",
			flexDirection: "column",
		},
		card: {
			background: "transparent",
			border: 0,
			borderBottom: `1px solid ${tokens.border}`,
			mb: 0,
			py: "20px",
			"&:last-of-type": { borderBottom: 0 },
		},
		cardRow: {
			display: "grid",
			gridTemplateColumns: "1fr auto",
			alignItems: "baseline",
			gap: "20px",
		},
		cardLeft: { minWidth: 0 },
		monitorName: {
			fontSize: 20,
			fontWeight: 700,
			letterSpacing: "-0.015em",
			color: tokens.text,
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
		},
		monitorMeta: {
			fontFamily: EDITORIAL_SECONDARY_SANS_STACK,
			fontSize: 12,
			color: tokens.textMuted,
			mt: "6px",
			display: "flex",
			gap: "12px",
			flexWrap: "wrap",
			alignItems: "center",
		},
		pill: {
			textTransform: "uppercase",
			letterSpacing: "0.12em",
			fontWeight: 700,
			color: tokens.textMuted,
		},
		pillHardware: {
			textTransform: "uppercase",
			letterSpacing: "0.12em",
			fontWeight: 700,
			color: tokens.up,
		},
		monitorUrl: {
			fontFamily: MONO_STACK,
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
			maxWidth: 280,
			fontSize: 12,
		},

		badge: (tone) => ({
			fontFamily: EDITORIAL_SECONDARY_SANS_STACK,
			fontSize: 10,
			fontWeight: 700,
			padding: "4px 10px",
			borderRadius: 0,
			textTransform: "uppercase",
			letterSpacing: "0.15em",
			whiteSpace: "nowrap",
			background: toneSoft(tone, tokens),
			color: toneColor(tone, tokens),
		}),

		heatmap: {
			mt: "16px",
			display: "grid",
			gridTemplateColumns: `repeat(${MAX_RECENT_CHECKS}, 1fr)`,
			gap: "2px",
			height: 40,
		},
		heatmapCell: (kind) => ({
			background: heatCellBg[kind],
			opacity: kind === "empty" ? 0.5 : 1,
		}),

		histogram: {
			mt: "16px",
			display: "grid",
			gridTemplateColumns: `repeat(${MAX_RECENT_CHECKS}, 1fr)`,
			gap: "2px",
			alignItems: "flex-end",
			height: 40,
		},
		bar: (kind, heightPct) => ({
			background: barBg[kind],
			minHeight: 3,
			opacity: kind === "empty" ? 0.5 : 1,
			height: `${heightPct}%`,
		}),
		chartStats: {
			fontFamily: EDITORIAL_SECONDARY_SANS_STACK,
			fontSize: 11,
			color: tokens.textMuted,
			fontVariantNumeric: "tabular-nums",
			textTransform: "uppercase",
			letterSpacing: "0.1em",
		},

		infra: {
			display: "grid",
			gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
			gap: "24px",
			mt: "20px",
			fontFamily: EDITORIAL_SECONDARY_SANS_STACK,
		},
		infraEmpty: { mt: "20px", color: tokens.textMuted, fontSize: 13 },
		gauge: {},
		gaugeLabel: {
			fontSize: 10,
			color: tokens.textMuted,
			textTransform: "uppercase",
			letterSpacing: "0.18em",
			fontWeight: 700,
		},
		gaugeValue: {
			fontSize: 28,
			fontWeight: 700,
			letterSpacing: "-0.02em",
			mt: "4px",
			fontVariantNumeric: "tabular-nums",
			fontFamily: SERIF_STACK,
			color: tokens.text,
		},
		gaugeBar: { height: 2, background: tokens.border, mt: "10px" },
		gaugeFill: (level, widthPct) => ({
			display: "block",
			height: "100%",
			background: gaugeFillBg[level],
			transition: "width 0.8s",
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
			fontSize: 11,
			mt: "56px",
			textTransform: "uppercase",
			letterSpacing: "0.2em",
			fontFamily: EDITORIAL_SECONDARY_SANS_STACK,
			"& a": {
				color: tokens.text,
				textDecoration: "none",
				borderBottom: `1px solid ${tokens.text}`,
				pb: "2px",
				fontWeight: 700,
			},
		},
	};
};
