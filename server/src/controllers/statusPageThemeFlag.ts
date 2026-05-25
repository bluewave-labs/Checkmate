import { DEFAULT_STATUS_PAGE_THEME, DEFAULT_STATUS_PAGE_THEME_MODE, type StatusPage } from "@/types/statusPage.js";

/**
 * When STATUS_PAGE_THEMES_ENABLED is false, the controller drops incoming
 * theme fields before persisting so an admin client can't accidentally store
 * a value the public page won't honour. Whatever a caller sends here for
 * `theme` / `themeMode` is silently ignored — the rest of the body is
 * preserved verbatim.
 *
 * The strip is silent (not a 400) because the kill switch is an ops-side
 * concern: API clients should not have to know whether the operator has
 * disabled themes today, only that their saved value won't take effect.
 * If we later decide we'd rather fail loudly, change this to throw a
 * 400 AppError; downstream consumers already handle it.
 */
export const withoutThemeFields = (body: Record<string, unknown>): Record<string, unknown> => {
	const rest = { ...body };
	delete rest.theme;
	delete rest.themeMode;
	return rest;
};

/**
 * When STATUS_PAGE_THEMES_ENABLED is false, callers reading a status page
 * should see the canonical default theme / mode regardless of what's stored
 * in Mongo. Whatever the user previously chose stays in the DB so flipping
 * the flag back on resurfaces their selection.
 */
export const applyDefaultTheme = (statusPage: StatusPage): StatusPage => ({
	...statusPage,
	theme: DEFAULT_STATUS_PAGE_THEME,
	themeMode: DEFAULT_STATUS_PAGE_THEME_MODE,
});
