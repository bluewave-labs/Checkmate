import globals from "globals";
import pluginJs from "@eslint/js";
import mochaPlugin from "eslint-plugin-mocha";
import tseslint from "typescript-eslint";

/*
Please do not forget to look at the latest eslint configurations and rules.
ESlint v9 configuration is different than v8.
"https://eslint.org/docs/latest/use/configure/"
*/

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		ignores: ["dist/**", "node_modules/**", "coverage/**"],
	},
	{
		languageOptions: {
			globals: {
				...globals.node, // Add Node.js globals
				...globals.chai, // Add Chai globals
			},
			ecmaVersion: 2023,
			sourceType: "module",
		},
	},
	pluginJs.configs.recommended, // Core JS rules
	...tseslint.configs.recommended, // TypeScript recommended rules
	mochaPlugin.configs.flat.recommended, // Mocha rules
	{
		files: ["**/*.ts", "**/*.tsx"],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "warn", // Warn on 'any' types
			"mocha/max-top-level-suites": "warn", // Warn if there are too many top-level suites instead of failing
		},
	},
];
