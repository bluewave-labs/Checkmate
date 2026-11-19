import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

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

const BASE_RESTRICTED_SYNTAX = [
	{
		// Rule #2 — color/bgcolor/borderColor as a string shorthand like "text.secondary".
		// Catches: <Typography color="text.secondary" /> — should be color={theme.palette.text.secondary}.
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
];

// Displayed dates go through formatDate / useFormatDate in Utils/TimeUtils.ts so they
// follow the user's timezone, language and time format. Matched by name on any receiver:
// numbers use formatNumber from Utils/FormatUtils.ts instead of toLocaleString.
const DATE_FORMATTING_MESSAGE =
	"Format displayed dates with useFormatDate() (or formatDate on status pages) from @/Utils/TimeUtils, and numbers with formatNumber from @/Utils/FormatUtils.";
const DATE_FORMATTING_RESTRICTIONS = [
	{
		selector: "MemberExpression[property.name=/^toLocale(Date|Time)?String$/]",
		message: DATE_FORMATTING_MESSAGE,
	},
	{
		selector: "MemberExpression[object.name='Intl'][property.name='DateTimeFormat']",
		message: DATE_FORMATTING_MESSAGE,
	},
];

// dayjs is for pickers and maintenance-window form values, never display. New files that
// need it are added to DAYJS_ALLOWED_FILES, so the exception is visible in review.
const DAYJS_IMPORT_MESSAGE =
	"dayjs is restricted to pickers and maintenance forms. Format displayed dates with useFormatDate() from @/Utils/TimeUtils, or add the file to DAYJS_ALLOWED_FILES in eslint.config.js.";
const DAYJS_ALLOWED_FILES = [
	"src/Utils/TimeUtils.ts",
	"src/Components/inputs/DatePicker.tsx",
	"src/Components/inputs/TimePicker.tsx",
	"src/Components/inputs/forms/FormDateTimePickerField.tsx",
	"src/Hooks/useMaintenanceWindowForm.ts",
	"src/Pages/Maintenance/MaintenanceWindowTable.tsx",
	"src/Pages/Maintenance/create/index.tsx",
	"src/Validation/maintenanceWindow.ts",
];
const dayjsImportRestriction = (extra = {}) => ({
	paths: [{ name: "dayjs", message: DAYJS_IMPORT_MESSAGE, ...extra }],
	patterns: [{ group: ["dayjs/*"], message: DAYJS_IMPORT_MESSAGE, ...extra }],
});

const FRONTEND_CONVENTION_RULES = {
	"no-restricted-syntax": [
		"warn",
		...BASE_RESTRICTED_SYNTAX,
		...DATE_FORMATTING_RESTRICTIONS,
	],
};

const ICON_MESSAGE =
	"Render lucide icons through the Icon design element: <Icon icon={Name} />, not <Name />.";
const CONVENTION_EXEMPT_FILES = [
	"src/Pages/StatusPage/Status/themes/**",
	"src/Components/whats-new/**",
	"src/Pages/Auth/components/AuthBrandPanel.tsx",
];
const noDirectLucideIcon = {
	meta: { type: "problem", schema: [], messages: { useIcon: ICON_MESSAGE } },
	create(context) {
		const lucideNames = new Set();
		return {
			ImportDeclaration(node) {
				if (node.source.value !== "lucide-react") return;
				if (node.importKind === "type") return;
				for (const specifier of node.specifiers) {
					if (specifier.importKind === "type") continue;
					lucideNames.add(specifier.local.name);
				}
			},
			JSXOpeningElement(node) {
				if (node.name.type !== "JSXIdentifier") return;
				if (!lucideNames.has(node.name.name)) return;
				context.report({ node, messageId: "useIcon" });
			},
		};
	},
};
const SPACING_MESSAGE =
	"Pass a LAYOUT or SPACING token to theme.spacing(), not a number: theme.spacing(LAYOUT.MD).";
const noRawSpacing = {
	meta: { type: "problem", schema: [], messages: { useToken: SPACING_MESSAGE } },
	create(context) {
		return {
			CallExpression(node) {
				if (node.callee.type !== "MemberExpression") return;
				if (node.callee.property.name !== "spacing") return;
				for (const arg of node.arguments) {
					const literal = arg.type === "UnaryExpression" ? arg.argument : arg;
					if (literal.type !== "Literal") continue;
					if (typeof literal.value !== "number" || literal.value === 0) continue;
					context.report({ node: arg, messageId: "useToken" });
				}
			},
		};
	},
};
const FONT_SIZE_MESSAGE =
	"Use a typographyLevels token for fontSize, not a raw value: fontSize={typographyLevels.l}.";
const isRawSize = (value) =>
	typeof value === "number" || (typeof value === "string" && /\d/.test(value));
const collectRawSizes = (node, found = []) => {
	if (!node) return found;
	if (node.type === "Literal" && isRawSize(node.value)) found.push(node);
	if (node.type === "TemplateLiteral" && node.expressions.length === 0) found.push(node);
	if (node.type === "JSXExpressionContainer") collectRawSizes(node.expression, found);
	if (node.type === "ConditionalExpression") {
		collectRawSizes(node.consequent, found);
		collectRawSizes(node.alternate, found);
	}
	if (node.type === "LogicalExpression") {
		collectRawSizes(node.left, found);
		collectRawSizes(node.right, found);
	}
	if (node.type === "ObjectExpression") {
		for (const property of node.properties) collectRawSizes(property.value, found);
	}
	return found;
};
const isIconSelector = (node) =>
	node?.type === "Property" &&
	typeof node.key.value === "string" &&
	node.key.value.includes(".MuiSvgIcon-root");
const noRawFontSize = {
	meta: { type: "problem", schema: [], messages: { useToken: FONT_SIZE_MESSAGE } },
	create(context) {
		const report = (value) => {
			for (const node of collectRawSizes(value)) {
				context.report({ node, messageId: "useToken" });
			}
		};
		return {
			JSXAttribute(node) {
				if (node.name.name !== "fontSize") return;
				report(node.value);
			},
			Property(node) {
				if (node.computed) return;
				if (node.key.name !== "fontSize" && node.key.value !== "fontSize") return;
				if (isIconSelector(node.parent.parent)) return;
				report(node.value);
			},
		};
	},
};
const checkmate = {
	rules: {
		"no-direct-lucide-icon": noDirectLucideIcon,
		"no-raw-spacing": noRawSpacing,
		"no-raw-font-size": noRawFontSize,
	},
};

const REACT_RULES = {
	"react/jsx-no-target-blank": "off",
	"react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
	"react/no-unescaped-entities": "off",
};

const TYPESCRIPT_FILES = ["**/*.ts", "**/*.tsx"];

export default [
	{
		ignores: ["dist/**"],
	},
	{
		files: ["**/*.{js,jsx,ts,tsx}"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.browser,
				...globals.es2020,
				__APP_VERSION__: "readonly",
				process: "readonly",
			},
		},
		settings: { react: { version: "18.2" } },
	},
	js.configs.recommended,
	react.configs.flat.recommended,
	react.configs.flat["jsx-runtime"],
	{
		plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
		rules: {
			...reactHooks.configs.recommended.rules,
			...REACT_RULES,
			...FRONTEND_CONVENTION_RULES,
			"no-restricted-imports": ["warn", dayjsImportRestriction()],
		},
	},
	...tseslint.configs.recommended.map((config) => ({
		...config,
		files: TYPESCRIPT_FILES,
	})),
	{
		files: TYPESCRIPT_FILES,
		rules: {
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],
			// TS handles these; eslint duplicates create noise on existing files.
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/no-empty-object-type": "off",
			"@typescript-eslint/no-unsafe-function-type": "off",
			"@typescript-eslint/no-wrapper-object-types": "off",
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/no-non-null-assertion": "off",
			// Type-only imports (e.g. the Dayjs type) don't format anything
			"no-restricted-imports": "off",
			"@typescript-eslint/no-restricted-imports": [
				"warn",
				dayjsImportRestriction({ allowTypeImports: true }),
			],
		},
	},
	{
		files: ["src/**/*.{js,jsx,ts,tsx}"],
		plugins: { checkmate },
		rules: { "checkmate/no-raw-spacing": "error" },
	},
	{
		files: ["src/**/*.{jsx,tsx}"],
		ignores: CONVENTION_EXEMPT_FILES,
		rules: { "checkmate/no-direct-lucide-icon": "error" },
	},
	{
		files: ["src/**/*.{js,jsx,ts,tsx}"],
		ignores: CONVENTION_EXEMPT_FILES,
		rules: { "checkmate/no-raw-font-size": "error" },
	},
	{
		files: DAYJS_ALLOWED_FILES,
		rules: {
			"no-restricted-imports": "off",
			"@typescript-eslint/no-restricted-imports": "off",
		},
	},
	{
		// The one place allowed to format dates directly
		files: ["src/Utils/TimeUtils.ts"],
		rules: {
			"no-restricted-syntax": ["warn", ...BASE_RESTRICTED_SYNTAX],
		},
	},
];
