// MUI sx keys that have a native (system) prop equivalent.
// Flagged when found inside an sx={{ ... }} object literal — see frontend-conventions.md rule #1.
const SX_NATIVE_EQUIVALENT_KEYS = [
	"color",
	"bgcolor",
	"backgroundColor",
	"borderRadius",
	"border",
	"borderTop",
	"borderBottom",
	"borderLeft",
	"borderRight",
	"width",
	"height",
	"minHeight",
	"maxWidth",
	"minWidth",
	"maxHeight",
	"p",
	"pt",
	"pb",
	"px",
	"py",
	"pl",
	"pr",
	"m",
	"mt",
	"mb",
	"mx",
	"my",
	"ml",
	"mr",
	"display",
	"textAlign",
	"fontWeight",
	"fontSize",
	"lineHeight",
	"gap",
];

// MUI components that accept system props as top-level attributes.
// sx={{ color, p, mt, ... }} on these can be hoisted into native props.
// Dialog*, Drawer*, Menu*, Tab*, Toolbar etc. only accept sx — don't flag those.
const SX_HOISTABLE_COMPONENTS = [
	"Box",
	"Stack",
	"Typography",
	"Grid",
	"Container",
	"Paper",
	"Card",
	"CardContent",
	"CardActions",
	"CardHeader",
	"Divider",
	"Link",
	"Chip",
];

const sxKeySelector = SX_HOISTABLE_COMPONENTS.flatMap((component) =>
	SX_NATIVE_EQUIVALENT_KEYS.map(
		(k) =>
			`JSXOpeningElement[name.name='${component}'] > JSXAttribute[name.name='sx'] > JSXExpressionContainer > ObjectExpression > Property[key.name='${k}']`
	)
).join(", ");

const FRONTEND_CONVENTION_RULES = {
	// Rule #2 — color/bgcolor/borderColor as a string shorthand like "text.secondary".
	// Catches: <Typography color="text.secondary" /> — should be color={theme.palette.text.secondary}.
	"no-restricted-syntax": [
		"warn",
		{
			selector:
				"JSXAttribute[name.name=/^(color|bgcolor|borderColor)$/] > Literal[value=/\\./]",
			message:
				'Use the full theme path instead of a string shorthand. e.g. color={theme.palette.text.secondary} not color="text.secondary". See docs/frontend-conventions.md rule #2.',
		},
		{
			// Rule #1 — sx={{ key: ... }} where key has a native prop equivalent.
			selector: sxKeySelector,
			message:
				"Hoist this key out of `sx` onto the component as a native MUI prop (e.g. color={...}, mt={...}, width={...}). See docs/frontend-conventions.md rule #1.",
		},
		{
			// Rule #4 — importing the singleton theme from the Theme module.
			// Catches: import { theme } from "@/Utils/Theme/Theme" — should be useTheme() inside the component.
			selector:
				"ImportDeclaration[source.value='@/Utils/Theme/Theme'] > ImportSpecifier[imported.name='theme']",
			message:
				"Don't import { theme } from @/Utils/Theme/Theme — use the useTheme() hook inside the component. See docs/frontend-conventions.md rule #4.",
		},
		{
			// Rule #3 (subset) — Typography fontSize={13} is the body default; drop it.
			selector:
				"JSXOpeningElement[name.name='Typography'] JSXAttribute[name.name='fontSize'] > JSXExpressionContainer > Literal[value=13]",
			message:
				"fontSize={13} is the Typography body default — drop the prop. For other sizes use typographyLevels tokens. See docs/frontend-conventions.md rule #3.",
		},
	],
};

module.exports = {
	root: true,
	env: { browser: true, es2020: true },
	extends: [
		"eslint:recommended",
		"plugin:react/recommended",
		"plugin:react/jsx-runtime",
		"plugin:react-hooks/recommended",
	],
	ignorePatterns: ["dist", ".eslintrc.cjs"],
	parserOptions: { ecmaVersion: "latest", sourceType: "module" },
	settings: { react: { version: "18.2" } },
	plugins: ["react-refresh"],
	rules: {
		"react/jsx-no-target-blank": "off",
		"react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
		"react/no-unescaped-entities": "off",
		...FRONTEND_CONVENTION_RULES,
	},
	globals: {
		__APP_VERSION__: "readonly",
		process: "readonly",
	},
	overrides: [
		{
			files: ["**/*.ts", "**/*.tsx"],
			parser: "@typescript-eslint/parser",
			parserOptions: { ecmaVersion: "latest", sourceType: "module" },
			extends: [
				"eslint:recommended",
				"plugin:@typescript-eslint/recommended",
				"plugin:react/recommended",
				"plugin:react/jsx-runtime",
				"plugin:react-hooks/recommended",
			],
			plugins: ["@typescript-eslint", "react-refresh"],
			rules: {
				"react/jsx-no-target-blank": "off",
				"react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
				"react/no-unescaped-entities": "off",
				"no-unused-vars": "off",
				"@typescript-eslint/no-unused-vars": [
					"warn",
					{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
				],
				// TS handles these; eslint duplicates create noise on existing files.
				"@typescript-eslint/no-explicit-any": "off",
				"@typescript-eslint/ban-ts-comment": "off",
				"@typescript-eslint/ban-types": "off",
				"@typescript-eslint/no-empty-function": "off",
				"@typescript-eslint/no-empty-interface": "off",
				"@typescript-eslint/no-non-null-assertion": "off",
				...FRONTEND_CONVENTION_RULES,
			},
		},
	],
};
