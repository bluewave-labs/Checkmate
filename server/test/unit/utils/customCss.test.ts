import { describe, expect, it } from "@jest/globals";
import { cssReferencesExternalResource } from "../../../src/utils/customCss.ts";

describe("cssReferencesExternalResource", () => {
	it("returns false for empty or non-string input", () => {
		expect(cssReferencesExternalResource("")).toBe(false);
		expect(cssReferencesExternalResource(null)).toBe(false);
		expect(cssReferencesExternalResource(undefined)).toBe(false);
	});

	it("allows benign CSS", () => {
		expect(cssReferencesExternalResource("li{outline:3px dashed red}footer{display:none}")).toBe(false);
	});

	it("allows data: and relative urls", () => {
		expect(cssReferencesExternalResource("li{background:url(data:image/png;base64,AAAA)}")).toBe(false);
		expect(cssReferencesExternalResource("li{background:url(/assets/logo.png)}")).toBe(false);
		expect(cssReferencesExternalResource("li{background:url(logo.png)}")).toBe(false);
	});

	it("allows data: SVG that embeds the SVG namespace URL", () => {
		const css = `li{background:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'></svg>")}`;
		expect(cssReferencesExternalResource(css)).toBe(false);
	});

	it("flags @import", () => {
		expect(cssReferencesExternalResource('@import url("https://evil.example/x.css");')).toBe(true);
		expect(cssReferencesExternalResource('@import "https://evil.example/x.css";')).toBe(true);
	});

	it("flags external url()", () => {
		expect(cssReferencesExternalResource('body{background:url("https://evil.example/x")}')).toBe(true);
		expect(cssReferencesExternalResource("body{background:url(http://evil.example/x)}")).toBe(true);
	});

	it("flags protocol-relative url()", () => {
		expect(cssReferencesExternalResource("body{background:url(//evil.example/x)}")).toBe(true);
	});

	it("flags external string-form image functions", () => {
		expect(cssReferencesExternalResource('body{background:image-set("https://evil.example/x" 1x)}')).toBe(true);
		expect(cssReferencesExternalResource('body{background:-webkit-image-set("//evil.example/x" 1x)}')).toBe(true);
		expect(cssReferencesExternalResource('body{background-image:image("https://evil.example/x")}')).toBe(true);
	});

	it("flags url() obfuscated with a trailing parse error", () => {
		expect(cssReferencesExternalResource("body{background:url(http://evil.example/x) !!!}")).toBe(true);
	});

	it("flags references obfuscated with inline comments", () => {
		expect(cssReferencesExternalResource('body{background:/*c*/url("http://evil.example/x")}')).toBe(true);
		expect(cssReferencesExternalResource('@import/*c*/"http://evil.example/x";')).toBe(true);
		expect(cssReferencesExternalResource('body{background:image-set(/*c*/"http://evil.example/x" 1x)}')).toBe(true);
	});

	it("allows a comment that makes url() a bad token the browser never fetches", () => {
		expect(cssReferencesExternalResource('body{background:url(/*c*/ "http://evil.example/x")}')).toBe(false);
	});

	it("flags url() obfuscated with CSS escapes", () => {
		expect(cssReferencesExternalResource("body{background:\\75 rl(http://evil.example/x)}")).toBe(true);
		expect(cssReferencesExternalResource('\\40 import "http://evil.example/x";')).toBe(true);
	});

	it("flags a scheme split by a line continuation", () => {
		expect(cssReferencesExternalResource('body{background:url("htt\\\nps://evil.example/x")}')).toBe(true);
		expect(cssReferencesExternalResource('body{background:url("htt\\\r\nps://evil.example/x")}')).toBe(true);
	});

	it("flags a scheme split by a hex escape", () => {
		expect(cssReferencesExternalResource('body{background:url("\\68 ttps://evil.example/x")}')).toBe(true);
	});
});
