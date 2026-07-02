import type { SxProps, Theme } from "@mui/material/styles";
import type { StatusPageThemeTokens } from "../tokens";
import type { OverallTone } from "../shared/overallStatus";
import { refinedStyles, type RefinedStyles } from "../refined/styles";

type FlatSx = Exclude<SxProps<Theme>, readonly unknown[] | ((theme: Theme) => unknown)>;

const extend = (base: SxProps<Theme>, overrides: SxProps<Theme>): SxProps<Theme> => [
	base as FlatSx,
	overrides as FlatSx,
];

export const minimalStyles = (
	tokens: StatusPageThemeTokens,
	isDark: boolean
): RefinedStyles => {
	const base = refinedStyles(tokens, isDark);

	return {
		...base,
		page: extend(base.page, {
			maxWidth: 820,
			p: { xs: "32px 16px 64px", md: "48px 20px 72px" },
		}),
		top: extend(base.top, {
			mb: "44px",
			pb: "16px",
			borderBottom: `1px solid ${tokens.border}`,
		}),
		logoMono: extend(base.logoMono, {
			borderRadius: "50%",
			background: tokens.text,
		}),
		hero: extend(base.hero, {
			alignItems: "center",
			background: "transparent",
			border: 0,
			boxShadow: "none",
			p: 0,
			mb: "40px",
		}),
		heroRow: extend(base.heroRow, { justifyContent: "center" }),
		heroTitle: extend(base.heroTitle, {
			flex: "initial",
			fontSize: { xs: 22, md: 28 },
			fontWeight: 650,
			textAlign: "center",
		}),
		heroIcon: (_tone: OverallTone) => ({ display: "none" }),
		heroSub: extend(base.heroSub, { textAlign: "center", mt: "4px" }),
		chartSwitch: extend(base.chartSwitch, { borderRadius: tokens.radius }),
		card: extend(base.card, {
			boxShadow: "none",
			transition: "none",
			"&:hover": { transform: "none", boxShadow: "none" },
		}),
		cardRow: extend(base.cardRow, { p: "14px 16px" }),
		badge: (tone) =>
			extend(base.badge(tone), {
				background: "transparent",
				p: 0,
			}),
		gauge: extend(base.gauge, { borderRadius: tokens.radius }),
		footer: extend(base.footer, { mt: "48px", fontSize: 11 }),
	};
};
