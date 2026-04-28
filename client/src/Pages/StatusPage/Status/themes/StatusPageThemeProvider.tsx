import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import {
	DEFAULT_STATUS_PAGE_THEME,
	DEFAULT_STATUS_PAGE_THEME_MODE,
	type StatusPageTheme,
	type StatusPageThemeMode,
} from "@/Types/StatusPage";
import { themeTokens, toCssVars, type StatusPageThemeTokens } from "./tokens";

type ResolvedMode = "light" | "dark";

interface StatusPageThemeContextValue {
	theme: StatusPageTheme;
	mode: ResolvedMode;
	tokens: StatusPageThemeTokens;
}

const StatusPageThemeContext = createContext<StatusPageThemeContextValue | null>(null);

const resolveSystemMode = (): ResolvedMode => {
	if (typeof window === "undefined" || !window.matchMedia) return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

interface Props {
	theme?: StatusPageTheme;
	themeMode?: StatusPageThemeMode;
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

export const StatusPageThemeProvider = ({
	theme,
	themeMode,
	paintBody = false,
	transparent = false,
	children,
}: Props) => {
	const resolvedTheme = theme ?? DEFAULT_STATUS_PAGE_THEME;
	const resolvedThemeMode = themeMode ?? DEFAULT_STATUS_PAGE_THEME_MODE;

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
		const bg = themeTokens[theme ?? DEFAULT_STATUS_PAGE_THEME][resolvedMode].bg;
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
	}, [paintBody, theme, resolvedThemeMode, systemMode]);

	const resolvedMode: ResolvedMode =
		resolvedThemeMode === "auto" ? systemMode : resolvedThemeMode;
	const tokens = themeTokens[resolvedTheme][resolvedMode];

	const style = useMemo<React.CSSProperties>(
		() =>
			transparent
				? (toCssVars(tokens) as React.CSSProperties)
				: {
						...(toCssVars(tokens) as React.CSSProperties),
						background: tokens.bg,
						minHeight: "100vh",
					},
		[tokens, transparent]
	);

	const value = useMemo(
		() => ({ theme: resolvedTheme, mode: resolvedMode, tokens }),
		[resolvedTheme, resolvedMode, tokens]
	);

	return (
		<StatusPageThemeContext.Provider value={value}>
			<div
				data-status-theme={resolvedTheme}
				data-status-mode={resolvedMode}
				data-status-transparent={transparent ? "" : undefined}
				style={style}
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
		};
	}
	return ctx;
};
