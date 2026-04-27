import { describe, expect, it } from "@jest/globals";
import { applyDefaultTheme, withoutThemeFields } from "../../../src/controllers/statusPageThemeFlag.ts";
import { DEFAULT_STATUS_PAGE_THEME, DEFAULT_STATUS_PAGE_THEME_MODE } from "../../../src/types/statusPage.ts";
import { makeStatusPage } from "../../helpers/makeStatusPage.ts";

describe("statusPageThemeFlag", () => {
	describe("withoutThemeFields", () => {
		it("removes theme and themeMode from a body that has them", () => {
			const body = { companyName: "Co", theme: "modern", themeMode: "dark" };
			const result = withoutThemeFields(body);
			expect(result).toEqual({ companyName: "Co" });
		});

		it("is a no-op when neither field is present", () => {
			const body = { companyName: "Co", url: "page" };
			const result = withoutThemeFields(body);
			expect(result).toEqual({ companyName: "Co", url: "page" });
		});

		it("removes only the theme fields when one is present", () => {
			const body = { companyName: "Co", theme: "bold" };
			const result = withoutThemeFields(body);
			expect(result).toEqual({ companyName: "Co" });
		});

		it("does not mutate the input body", () => {
			const body = { companyName: "Co", theme: "modern", themeMode: "dark" };
			withoutThemeFields(body);
			expect(body).toEqual({ companyName: "Co", theme: "modern", themeMode: "dark" });
		});

		it("preserves all other fields verbatim", () => {
			const body = {
				companyName: "Co",
				monitors: ["m-1", "m-2"],
				isPublished: true,
				showCharts: false,
				color: "#13715B",
				theme: "editorial",
				themeMode: "light",
			};
			const result = withoutThemeFields(body);
			expect(result).toEqual({
				companyName: "Co",
				monitors: ["m-1", "m-2"],
				isPublished: true,
				showCharts: false,
				color: "#13715B",
			});
		});
	});

	describe("applyDefaultTheme", () => {
		it("overwrites theme and themeMode with the canonical defaults", () => {
			const sp = makeStatusPage({ theme: "modern", themeMode: "dark" });
			const result = applyDefaultTheme(sp);
			expect(result.theme).toBe(DEFAULT_STATUS_PAGE_THEME);
			expect(result.themeMode).toBe(DEFAULT_STATUS_PAGE_THEME_MODE);
		});

		it("leaves all other fields untouched", () => {
			const sp = makeStatusPage({
				companyName: "Test Co",
				url: "my-page",
				monitors: ["mon-1", "mon-2"],
				isPublished: true,
				color: "#13715B",
			});
			const result = applyDefaultTheme(sp);
			expect(result.companyName).toBe("Test Co");
			expect(result.url).toBe("my-page");
			expect(result.monitors).toEqual(["mon-1", "mon-2"]);
			expect(result.isPublished).toBe(true);
			expect(result.color).toBe("#13715B");
		});

		it("does not mutate the input status page", () => {
			const sp = makeStatusPage({ theme: "modern", themeMode: "dark" });
			applyDefaultTheme(sp);
			expect(sp.theme).toBe("modern");
			expect(sp.themeMode).toBe("dark");
		});

		it("works on a status page that has no theme set yet", () => {
			const sp = makeStatusPage({ theme: undefined, themeMode: undefined });
			const result = applyDefaultTheme(sp);
			expect(result.theme).toBe(DEFAULT_STATUS_PAGE_THEME);
			expect(result.themeMode).toBe(DEFAULT_STATUS_PAGE_THEME_MODE);
		});
	});
});
