import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { alpha, darken } from "@mui/material/styles";
import {
	DEFAULT_STATUS_PAGE_THEME,
	resolveStatusPageTheme,
	resolveStatusPageThemeMode,
	type StatusPageTheme,
	type StatusPageThemeMode,
} from "@/Types/StatusPage";
import { resolveTimezone } from "@/Utils/TimeUtils";
import { themeTokens, type StatusPageThemeTokens } from "./tokens";

type ResolvedMode = "light" | "dark";

interface StatusPageThemeContextValue {
	theme: StatusPageTheme;
	mode: ResolvedMode;
	tokens: StatusPageThemeTokens;
	timezone: string;
}

const StatusPageThemeContext = createContext<StatusPageThemeContextValue | null>(null);

const resolveSystemMode = (): ResolvedMode => {
	if (typeof window === "undefined" || !window.matchMedia) return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

interface Props {
	theme?: StatusPageTheme;
	themeMode?: StatusPageThemeMode;
	timezone?: string;
	/**
	 * Brand color picked in the status-page appearance settings. When
	 * provided, it feeds `tokens.brand` / `brandStrong` / `brandSoft`,
	 * which theme styles use for accent surfaces (hero, active tabs,
	 * links). It does NOT recolor the semantic `up`/OK status color, so
	 * a red or orange brand cannot make the "all operational" indicator
	 * signal downtime.
	 */
	brandColor?: string;
	/**
	 * When true, paint the document body with the theme background so it
	 * covers beyond the provider's wrapper (useful on the public route
	 * where no admin shell sits behind). Defaults to false for admin
	 * previews that already have an app background.
	 */
	paintBody?: boolean;
	/**
	 * When true, the provider's wrapper div does NOT paint its own
	 * background or set a min-height. Use this when the wrapper is
	 * inside a clipped container (e.g. BrowserFrame) that already sets
	 * the visible background, so the wrapper's bg doesn't bleed past the
	 * container's rounded corners.
	 */
	transparent?: boolean;
	children: ReactNode;
}

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

// Resolve the brand triple that theme styles read from. A customer's
// picked color (when valid) overrides the theme's default; otherwise
// the theme's own `brand*` values win, and finally we fall back to the
// `up*` triple so unmigrated theme styles have something to consume.
const resolveBrandTokens = (
	tokens: StatusPageThemeTokens,
	brandColor: string | undefined
): StatusPageThemeTokens => {
	const validOverride = brandColor && HEX_COLOR.test(brandColor) ? brandColor : undefined;
	const brand = validOverride ?? tokens.brand ?? tokens.up;
	const brandStrong = validOverride
		? darken(validOverride, 0.2)
		: (tokens.brandStrong ?? tokens.upStrong);
	const brandSoft = validOverride
		? alpha(validOverride, 0.15)
		: (tokens.brandSoft ?? tokens.upSoft);
	return { ...tokens, brand, brandStrong, brandSoft };
};

export const StatusPageThemeProvider = ({
	theme,
	themeMode,
	timezone,
	brandColor,
	paintBody = false,
	transparent = false,
	children,
}: Props) => {
	const resolvedTheme = resolveStatusPageTheme(theme);
	const resolvedThemeMode = resolveStatusPageThemeMode(themeMode);
	const resolvedTimezone = resolveTimezone(timezone);

	const [systemMode, setSystemMode] = useState<ResolvedMode>(resolveSystemMode);

	useEffect(() => {
		if (resolvedThemeMode !== "auto") return;
		if (typeof window === "undefined" || !window.matchMedia) return;
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		// Reconcile on first paint whenever we (re-)enter auto mode — only
		// when it disagrees with the stored value, so we don't trigger an
		// extra render on the common hot path.
		const next: ResolvedMode = mq.matches ? "dark" : "light";
		setSystemMode((prev) => (prev === next ? prev : next));
		const handler = (e: MediaQueryListEvent) =>
			setSystemMode(e.matches ? "dark" : "light");
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, [resolvedThemeMode]);

	useEffect(() => {
		if (!paintBody || typeof document === "undefined") return;
		const html = document.documentElement;
		const body = document.body;
		const prev = {
			htmlBg: html.style.background,
			bodyBg: body.style.background,
			bodyMargin: body.style.margin,
			htmlColorScheme: html.style.colorScheme,
		};
		const resolvedMode = resolvedThemeMode === "auto" ? systemMode : resolvedThemeMode;
		const bg = themeTokens[resolvedTheme][resolvedMode].bg;
		html.style.background = bg;
		body.style.background = bg;
		body.style.margin = "0";
		html.style.colorScheme = resolvedMode;
		return () => {
			html.style.background = prev.htmlBg;
			body.style.background = prev.bodyBg;
			body.style.margin = prev.bodyMargin;
			html.style.colorScheme = prev.htmlColorScheme;
		};
	}, [paintBody, resolvedTheme, resolvedThemeMode, systemMode]);

	const resolvedMode: ResolvedMode =
		resolvedThemeMode === "auto" ? systemMode : resolvedThemeMode;
	const baseTokens = themeTokens[resolvedTheme][resolvedMode];
	const tokens = useMemo(
		() => resolveBrandTokens(baseTokens, brandColor),
		[baseTokens, brandColor]
	);

	const value = useMemo(
		() => ({
			theme: resolvedTheme,
			mode: resolvedMode,
			tokens,
			timezone: resolvedTimezone,
		}),
		[resolvedTheme, resolvedMode, tokens, resolvedTimezone]
	);

	return (
		<StatusPageThemeContext.Provider value={value}>
			<div
				style={
					transparent
						? undefined
						: {
								background: tokens.bg,
								minHeight: "100vh",
							}
				}
			>
				{children}
			</div>
		</StatusPageThemeContext.Provider>
	);
};

export const useStatusPageTheme = (): StatusPageThemeContextValue => {
	const ctx = useContext(StatusPageThemeContext);
	if (!ctx) {
		return {
			theme: DEFAULT_STATUS_PAGE_THEME,
			mode: resolveSystemMode(),
			tokens: themeTokens[DEFAULT_STATUS_PAGE_THEME][resolveSystemMode()],
			timezone: resolveTimezone(),
		};
	}
	return ctx;
};
