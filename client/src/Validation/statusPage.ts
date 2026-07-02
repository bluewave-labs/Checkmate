import { z } from "zod";
import type { FieldPath } from "react-hook-form";
import { STATUS_PAGE_THEMES, STATUS_PAGE_THEME_MODES } from "@/Types/StatusPage";
import { cssReferencesExternalResource } from "@/Utils/customCss";

// Wizard step a field is validated on. Attached inline to each field below so
// the grouping lives next to the field definition; unannotated fields default
// to step 0. Read via `statusPageStepFieldsFor`. Mirrors the monitor schema's
// `monitorStepRegistry` so the create-status-page wizard can't drift from the
// field definitions.
export const statusPageStepRegistry = z.registry<{ step: number }>();

const statusPageHostnameRegex =
	/^(?=.{1,253}$)([a-zA-Z0-9_](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

const normalizeCustomDomainInput = (raw: string | null): string | null => {
	if (raw === null) {
		return null;
	}

	const trimmed = raw.trim().toLowerCase();
	if (!trimmed) {
		return null;
	}

	const withoutScheme = trimmed.replace(/^https?:\/\//, "");
	return withoutScheme.split("/")[0]?.split(":")[0] ?? null;
};

export const statusPageSchema = z.object({
	companyName: z
		.string()
		.min(1, "Company name is required")
		.max(100, "Company name must be at most 100 characters"),
	url: z
		.string()
		.min(1, "URL is required")
		.max(50, "URL must be at most 50 characters")
		.regex(
			/^[a-z0-9-]+$/,
			"URL can only contain lowercase letters, numbers, and hyphens"
		),
	customDomain: z
		.union([z.string(), z.null()])
		.transform(normalizeCustomDomainInput)
		.refine((domain) => domain === null || statusPageHostnameRegex.test(domain), {
			message: "Enter a valid domain name (e.g. status.example.com)",
		}),
	timezone: z.string().optional(),
	type: z
		.array(z.enum(["uptime", "infrastructure"]))
		.min(1, "At least one type is required"),
	color: z.string().min(1, "Color is required").register(statusPageStepRegistry, {
		step: 1,
	}),
	monitors: z.array(z.string()).min(1, "At least one monitor is required"),
	isPublished: z.boolean(),
	showCharts: z.boolean().register(statusPageStepRegistry, { step: 1 }),
	showUptimePercentage: z.boolean().register(statusPageStepRegistry, { step: 1 }),
	showAdminLoginLink: z.boolean().register(statusPageStepRegistry, { step: 1 }),
	showInfrastructure: z.boolean().register(statusPageStepRegistry, { step: 1 }),
	customCSS: z
		.string()
		.max(100000, "Custom CSS must be at most 100000 characters")
		.refine((css) => !cssReferencesExternalResource(css), {
			message: "Custom CSS cannot reference external URLs or use @import",
		})
		.optional()
		.register(statusPageStepRegistry, { step: 1 }),
	theme: z
		.enum(STATUS_PAGE_THEMES)
		.optional()
		.register(statusPageStepRegistry, { step: 1 }),
	themeMode: z
		.enum(STATUS_PAGE_THEME_MODES)
		.optional()
		.register(statusPageStepRegistry, { step: 1 }),
	logo: z
		.object({
			data: z.string(),
			contentType: z.string(),
		})
		.nullable()
		.optional()
		.register(statusPageStepRegistry, { step: 1 }),
});

export type StatusPageFormData = z.infer<typeof statusPageSchema>;

// The step each field is validated on, from the per-field
// `statusPageStepRegistry` metadata (unannotated fields default to step 0).
const fieldSteps = (): [name: FieldPath<StatusPageFormData>, step: number][] =>
	Object.entries(statusPageSchema.shape).map(([name, field]) => [
		name as FieldPath<StatusPageFormData>,
		statusPageStepRegistry.get(field)?.step ?? 0,
	]);

// The fields that belong to a given wizard step. Derived from the schema so it
// can't drift from the field definitions.
export const statusPageStepFieldsFor = (step: number): FieldPath<StatusPageFormData>[] =>
	fieldSteps()
		.filter(([, fieldStep]) => fieldStep === step)
		.map(([name]) => name);

// Number of wizard steps, derived from the highest step its fields declare.
export const statusPageStepCount = (): number =>
	Math.max(0, ...fieldSteps().map(([, step]) => step)) + 1;
