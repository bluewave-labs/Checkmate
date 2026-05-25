import type { SxProps, Theme } from "@mui/material/styles";
import type { StatusPageThemeTokens } from "../tokens";
import { type OverallTone, toneColor, toneSoft } from "../shared/overallStatus";
import { BOLD_SANS_STACK, MONO_STACK } from "../shared/fontStacks";
import { MAX_RECENT_CHECKS } from "@/Types/Monitor";

export type BoldHeatCell = "fast" | "med" | "slow" | "down" | "empty";
export type BoldBarKind = "up" | "down" | "empty";
export type BoldGaugeFill = "ok" | "warm" | "hot";

export interface BoldStyles {
	page: SxProps<Theme>;
	top: SxProps<Theme>;
	brand: SxProps<Theme>;
	logoConic: SxProps<Theme>;
	logoImg: SxProps<Theme>;
	hero: SxProps<Theme>;
	heroTitle: SxProps<Theme>;
	heroCheck: (tone: OverallTone) => SxProps<Theme>;
	heroSub: SxProps<Theme>;
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
	heatmapCell: (kind: BoldHeatCell) => SxProps<Theme>;
	histogram: SxProps<Theme>;
	bar: (kind: BoldBarKind, heightPct: number) => SxProps<Theme>;
	chartStats: SxProps<Theme>;
	infra: SxProps<Theme>;
	infraEmpty: SxProps<Theme>;
	gauge: SxProps<Theme>;
	gaugeLabel: SxProps<Theme>;
	gaugeValue: SxProps<Theme>;
	gaugeBar: SxProps<Theme>;
	gaugeFill: (level: BoldGaugeFill, widthPct: number) => SxProps<Theme>;
	gaugeSub: SxProps<Theme>;
	footer: SxProps<Theme>;
}

export const boldStyles = (
	tokens: StatusPageThemeTokens,
	isDark: boolean
): BoldStyles => {
	const heatCellBg: Record<BoldHeatCell, string> = {
		fast: tokens.up,
		med: `color-mix(in srgb, ${tokens.up} 70%, #ffffff 30%)`,
		slow: tokens.warn,
		down: tokens.down,
		empty: tokens.border,
	};
	const heatCellShadow: Record<BoldHeatCell, string> = {
		fast: `0 0 6px color-mix(in srgb, ${tokens.up} 18%, transparent)`,
		med: `0 0 6px color-mix(in srgb, ${tokens.up} 18%, transparent)`,
		slow: `0 0 6px color-mix(in srgb, ${tokens.warn} 20%, transparent)`,
		down: `0 0 6px color-mix(in srgb, ${tokens.down} 20%, transparent)`,
		empty: "none",
	};

	const barBg: Record<BoldBarKind, string> = {
		up: tokens.up,
		down: tokens.down,
		empty: tokens.border,
	};

	const gaugeFillBg: Record<BoldGaugeFill, string> = {
		ok: `linear-gradient(90deg, ${tokens.up}, color-mix(in srgb, ${tokens.up} 70%, #ffffff 30%))`,
		warm: `linear-gradient(90deg, ${tokens.warn}, #fbbf24)`,
		hot: `linear-gradient(90deg, ${tokens.down}, #fb7185)`,
	};

	const heroBgLight = `linear-gradient(135deg, color-mix(in srgb, ${tokens.up} 8%, transparent), transparent 60%), ${tokens.surface}`;
	const heroBgDark = `linear-gradient(135deg, color-mix(in srgb, ${tokens.up} 16%, transparent), transparent 60%), ${tokens.surface}`;

	const heroGlowLight = `radial-gradient(400px 200px at 20% 30%, color-mix(in srgb, ${tokens.up} 14%, transparent), transparent 60%), radial-gradient(300px 200px at 90% 80%, color-mix(in srgb, ${tokens.upStrong} 10%, transparent), transparent 60%)`;
	const heroGlowDark = `radial-gradient(400px 200px at 20% 30%, color-mix(in srgb, ${tokens.up} 32%, transparent), transparent 60%), radial-gradient(300px 200px at 90% 80%, color-mix(in srgb, ${tokens.upStrong} 22%, transparent), transparent 60%)`;

	return {
		page: {
			flex: "1 0 auto",
			maxWidth: 1040,
			width: "100%",
			mx: "auto",
			p: "56px 24px 96px",
			fontFamily: BOLD_SANS_STACK,
			fontSize: 14,
			lineHeight: 1.55,
			color: tokens.text,
			WebkitFontSmoothing: "antialiased",
		},

		top: {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			mb: "36px",
		},
		brand: {
			display: "flex",
			alignItems: "center",
			gap: "14px",
			fontWeight: 700,
			fontSize: 16,
			letterSpacing: "-0.01em",
			color: tokens.text,
		},
		logoConic: {
			width: 36,
			height: 36,
			borderRadius: "12px",
			background: `conic-gradient(from 140deg, ${tokens.up}, ${tokens.upStrong}, #0f766e, ${tokens.up})`,
			display: "grid",
			placeItems: "center",
			color: "#05070a",
			fontWeight: 900,
			fontSize: 14,
			boxShadow: `0 8px 24px color-mix(in srgb, ${tokens.up} 30%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
		},
		logoImg: { maxHeight: 36, maxWidth: 140, objectFit: "contain" },

		hero: {
			position: "relative",
			borderRadius: "22px",
			padding: "36px 36px 32px",
			mb: "28px",
			background: isDark ? heroBgDark : heroBgLight,
			border: `1px solid ${tokens.border}`,
			overflow: "hidden",
			"&::before": {
				content: '""',
				position: "absolute",
				inset: 0,
				background: isDark ? heroGlowDark : heroGlowLight,
				pointerEvents: "none",
				opacity: 0.8,
				zIndex: 0,
				...(isDark ? { mixBlendMode: "screen" } : {}),
			},
			"& > *": { position: "relative", zIndex: 1 },
		},
		heroTitle: {
			m: 0,
			fontSize: 34,
			fontWeight: 800,
			letterSpacing: "-0.02em",
			lineHeight: 1.1,
			color: tokens.text,
			display: "flex",
			alignItems: "center",
			gap: "10px",
		},
		heroCheck: (tone) => ({
			display: "inline-grid",
			placeItems: "center",
			width: 32,
			height: 32,
			borderRadius: "50%",
			background: toneColor(tone, tokens),
			color: tone === "down" ? "#fff" : "#05070a",
			flexShrink: 0,
			boxShadow: `0 0 0 6px ${toneSoft(tone, tokens)}`,
		}),
		heroSub: { mt: "10px", mb: 0, color: tokens.textMuted, fontSize: 14 },

		chartSwitchWrap: { display: "flex", justifyContent: "flex-end", mb: "16px" },
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
			padding: "8px 18px",
			cursor: "pointer",
			color: active ? tokens.up : tokens.textMuted,
			fontWeight: 700,
			textTransform: "uppercase",
			letterSpacing: "0.12em",
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
			borderRadius: "18px",
			overflow: "hidden",
			transition: "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.2s",
			"&:hover": {
				transform: "translateY(-3px)",
				borderColor: `color-mix(in srgb, ${tokens.up} 40%, ${tokens.border})`,
			},
		},
		cardRow: {
			display: "grid",
			gridTemplateColumns: "1fr auto",
			alignItems: "center",
			gap: "24px",
			p: "22px 28px",
		},
		cardLeft: { minWidth: 0 },
		monitorName: {
			fontWeight: 700,
			fontSize: 17,
			letterSpacing: "-0.01em",
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
			fontSize: 10,
			textTransform: "uppercase",
			letterSpacing: "0.1em",
			color: tokens.textMuted,
			background: `color-mix(in srgb, ${tokens.surface} 80%, ${tokens.bg})`,
			border: `1px solid ${tokens.border}`,
			padding: "3px 10px",
			borderRadius: "999px",
			fontWeight: 700,
		},
		pillHardware: {
			fontSize: 10,
			textTransform: "uppercase",
			letterSpacing: "0.1em",
			padding: "3px 10px",
			borderRadius: "999px",
			fontWeight: 700,
			color: tokens.up,
			borderColor: `color-mix(in srgb, ${tokens.up} 40%, transparent)`,
			border: `1px solid color-mix(in srgb, ${tokens.up} 40%, transparent)`,
			background: tokens.upSoft,
		},
		monitorUrl: {
			fontSize: 12,
			color: tokens.textMuted,
			fontFamily: MONO_STACK,
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
			maxWidth: 300,
		},

		badge: (tone) => ({
			fontSize: 11,
			fontWeight: 800,
			padding: "6px 14px",
			borderRadius: "999px",
			display: "inline-flex",
			alignItems: "center",
			gap: "7px",
			textTransform: "uppercase",
			letterSpacing: "0.08em",
			whiteSpace: "nowrap",
			background: toneSoft(tone, tokens),
			color: toneColor(tone, tokens),
			"&::before": {
				content: '""',
				width: 6,
				height: 6,
				borderRadius: "50%",
				background: "currentColor",
				boxShadow: "0 0 8px currentColor",
			},
		}),

		heatmap: {
			padding: "0 28px 22px",
			display: "grid",
			gridTemplateColumns: `repeat(${MAX_RECENT_CHECKS}, 1fr)`,
			gap: "3px",
			height: 48,
		},
		heatmapCell: (kind) => ({
			borderRadius: "3px",
			background: heatCellBg[kind],
			boxShadow: heatCellShadow[kind],
			opacity: kind === "empty" ? 0.4 : 1,
			transition: "transform 0.15s",
			"&:hover": { transform: "scaleY(1.2)" },
		}),

		histogram: {
			padding: "0 28px",
			display: "grid",
			gridTemplateColumns: `repeat(${MAX_RECENT_CHECKS}, 1fr)`,
			gap: "3px",
			alignItems: "flex-end",
			height: 48,
		},
		bar: (kind, heightPct) => ({
			background: barBg[kind],
			borderRadius: "3px",
			minHeight: 4,
			opacity: kind === "empty" ? 0.4 : 1,
			height: `${heightPct}%`,
		}),
		chartStats: {
			padding: "0 28px 22px",
			fontSize: 11,
			color: tokens.textMuted,
			fontVariantNumeric: "tabular-nums",
			fontWeight: 700,
			letterSpacing: "0.05em",
		},

		infra: {
			padding: "18px 28px 26px",
			display: "grid",
			gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
			gap: "16px",
		},
		infraEmpty: {
			padding: "18px 28px 26px",
			color: tokens.textMuted,
			fontSize: 13,
		},
		gauge: {
			border: `1px solid ${tokens.border}`,
			borderRadius: "16px",
			p: "16px 18px",
			background: `color-mix(in srgb, ${tokens.surface} 80%, ${tokens.bg})`,
		},
		gaugeLabel: {
			fontSize: 10,
			color: tokens.textMuted,
			textTransform: "uppercase",
			letterSpacing: "0.12em",
			fontWeight: 700,
		},
		gaugeValue: {
			fontSize: 30,
			fontWeight: 800,
			letterSpacing: "-0.02em",
			mt: "6px",
			fontVariantNumeric: "tabular-nums",
			color: tokens.text,
		},
		gaugeBar: {
			height: 6,
			background: tokens.border,
			borderRadius: "3px",
			overflow: "hidden",
			mt: "12px",
		},
		gaugeFill: (level, widthPct) => ({
			display: "block",
			height: "100%",
			background: gaugeFillBg[level],
			borderRadius: "3px",
			transition: "width 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)",
			width: `${Math.max(0, Math.min(100, widthPct))}%`,
		}),
		gaugeSub: {
			fontSize: 11,
			color: tokens.textMuted,
			mt: "10px",
			fontVariantNumeric: "tabular-nums",
		},

		footer: {
			textAlign: "center",
			color: tokens.textMuted,
			fontSize: 12,
			mt: "52px",
			"& a": {
				color: tokens.up,
				textDecoration: "underline",
				textUnderlineOffset: "3px",
				fontWeight: 800,
			},
		},
	};
};
