import globals from "globals";
import pluginJs from "@eslint/js";
import mochaPlugin from "eslint-plugin-mocha";

/*
Please do not forget to look at the latest eslint configurations and rules.
ESlint v9 configuration is different than v8.
"https://eslint.org/docs/latest/use/configure/"
*/

/** @type {import('eslint').Linter.Config[]} */
export default [
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
	mochaPlugin.configs.flat.recommended, // Mocha rules
	{
		rules: {
			"mocha/max-top-level-suites": "warn", // Warn if there are too many top-level suites instead of failing
		},
	},
];
