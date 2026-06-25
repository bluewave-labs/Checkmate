import { z } from "zod";
import type { FieldPath } from "react-hook-form";
import { GeoContinents } from "@/Types/GeoCheck";
import {
	DnsRecordTypes,
	HttpMethods,
	PageSpeedStrategies,
	type MonitorType,
} from "@/Types/Monitor";
import { ALL_HTTP_STATUS_CODES } from "@/Utils/statusCode";

// Wizard step a field is validated on. Attached inline to each field below so
// the grouping lives next to the field definition; unannotated fields default
// to step 0. Read via `stepFieldsFor`.
export const monitorStepRegistry = z.registry<{ step: number }>();

// URL schema with custom error message
const urlSchema = z.url({ message: "Please enter a valid URL" });

// Common base schema for all monitor types
const baseSchema = z.object({
	name: z
		.string()
		.min(1, "Monitor name is required")
		.max(50, "Monitor name must be at most 50 characters"),
	description: z.string().optional(),
	interval: z
		.number()
		.min(15000, "Interval must be at least 15 seconds")
		.register(monitorStepRegistry, { step: 1 }),
	notifications: z.array(z.string()).register(monitorStepRegistry, { step: 1 }),
	tags: z.array(z.string()).register(monitorStepRegistry, { step: 1 }),
	statusWindowSize: z
		.number({ message: "Status window size is required" })
		.min(1, "Status window size must be at least 1")
		.max(25, "Status window size must be at most 25")
		.register(monitorStepRegistry, { step: 1 }),
	statusWindowThreshold: z
		.number({ message: "Threshold percentage is required" })
		.min(1, "Incident percentage must be at least 1")
		.max(100, "Incident percentage must be at most 100")
		.register(monitorStepRegistry, { step: 1 }),
});

// Geo-distributed check fields. Only http and ping support geo checks
// (GeoCheckSupportedTypes), so these live on those schemas rather than the base
// — that way each type's step count is exactly what its own fields declare.
const geoCheckFields = {
	geoCheckEnabled: z.boolean().optional().register(monitorStepRegistry, { step: 2 }),
	geoCheckLocations: z
		.array(z.enum(GeoContinents))
		.optional()
		.register(monitorStepRegistry, { step: 2 }),
	geoCheckInterval: z
		.number()
		.min(300000, "Interval must be at least 5 minutes")
		.optional()
		.register(monitorStepRegistry, { step: 2 }),
};

// HTTP monitor schema
const httpStatusCodeSet = new Set(ALL_HTTP_STATUS_CODES.map((c) => c.id));
const httpStatusCode = z.number().refine((code) => httpStatusCodeSet.has(code), {
	message: "Must be a valid HTTP status code",
});

const httpSchema = baseSchema.extend({
	type: z.literal("http"),
	url: urlSchema,
	method: z.enum(HttpMethods).optional().register(monitorStepRegistry, { step: 2 }),
	ignoreTlsErrors: z.boolean().register(monitorStepRegistry, { step: 2 }),
	useAdvancedMatching: z.boolean().register(monitorStepRegistry, { step: 2 }),
	matchMethod: z
		.enum(["equal", "include", "regex", ""])
		.optional()
		.register(monitorStepRegistry, { step: 2 }),
	expectedValue: z.string().optional().register(monitorStepRegistry, { step: 2 }),
	jsonPath: z.string().optional().register(monitorStepRegistry, { step: 2 }),
	customUpCodes: z
		.array(httpStatusCode)
		.optional()
		.register(monitorStepRegistry, { step: 2 }),
	...geoCheckFields,
});

// Ping monitor schema
const pingSchema = baseSchema.extend({
	type: z.literal("ping"),
	url: z.string().min(1, "Host is required"),
	...geoCheckFields,
});

// Port monitor schema
const portSchema = baseSchema.extend({
	type: z.literal("port"),
	url: z.string().min(1, "Host is required"),
	port: z
		.number()
		.min(1, "Port must be at least 1")
		.max(65535, "Port must be at most 65535"),
});

// Docker monitor schema
const dockerSchema = baseSchema.extend({
	type: z.literal("docker"),
	url: z.string().min(1, "Container ID is required"),
});

// Game server monitor schema
const gameSchema = baseSchema.extend({
	type: z.literal("game"),
	url: z.string().min(1, "Host is required"),
	port: z
		.number()
		.min(1, "Port must be at least 1")
		.max(65535, "Port must be at most 65535"),
	gameId: z.string().min(1, "Game type is required"),
});

// gRPC monitor schema
const grpcSchema = baseSchema.extend({
	type: z.literal("grpc"),
	url: z.string().min(1, "Host is required"),
	port: z
		.number()
		.min(1, "Port must be at least 1")
		.max(65535, "Port must be at most 65535"),
	grpcServiceName: z.string().optional(),
	ignoreTlsErrors: z.boolean().register(monitorStepRegistry, { step: 2 }),
});

// PageSpeed monitor schema
const pagespeedSchema = baseSchema.extend({
	type: z.literal("pagespeed"),
	url: urlSchema,
	strategy: z.enum(PageSpeedStrategies),
});

// Hardware/Infrastructure monitor schema
const hardwareSchema = baseSchema.extend({
	type: z.literal("hardware"),
	url: urlSchema,
	secret: z.string({ message: "Secret is required" }).min(1, "Secret is required"),
	cpuAlertThreshold: z
		.number()
		.min(0, "CPU threshold must be at least 0")
		.max(100, "CPU threshold must be at most 100")
		.register(monitorStepRegistry, { step: 1 }),
	memoryAlertThreshold: z
		.number()
		.min(0, "Memory threshold must be at least 0")
		.max(100, "Memory threshold must be at most 100")
		.register(monitorStepRegistry, { step: 1 }),
	diskAlertThreshold: z
		.number()
		.min(0, "Disk threshold must be at least 0")
		.max(100, "Disk threshold must be at most 100")
		.register(monitorStepRegistry, { step: 1 }),
	tempAlertThreshold: z
		.number()
		.min(0, "Temperature threshold must be at least 0")
		.max(150, "Temperature threshold must be at most 150")
		.register(monitorStepRegistry, { step: 1 }),
	selectedDisks: z.array(z.string()),
});

// WebSocket monitor schema
const websocketSchema = baseSchema.extend({
	type: z.literal("websocket"),
	url: z.string().min(1, "WebSocket URL is required"),
	ignoreTlsErrors: z.boolean().register(monitorStepRegistry, { step: 2 }),
});

// Hostname (FQDN) — labels of 1-63 alphanumerics/hyphens separated by dots,
// optionally prefixed with `_` for service labels (e.g. _dmarc, _imaps._tcp).
// No scheme, port, path, or whitespace. Total length ≤ 253.
const hostnameRegex =
	/^(?=.{1,253}$)([a-zA-Z0-9_](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

// Script monitor schema
const scriptSchema = baseSchema.extend({
	type: z.literal("script"),
	url: z.string().min(1, "Agent URL is required"),
	secret: z.string().optional(),
	scriptId: z.string().min(1, "Select a script"),
	scriptExecutionTarget: z.enum(["capture", "probe"]),
	probeId: z.string().optional(),
	scriptExitCodeSuccess: z.number().min(0).max(255).optional(),
	scriptOutputMatchRegex: z.string().optional(),
	scriptMaxExecutionTimeMs: z.number().min(1000).max(300000).optional(),
	scriptParameterOverrides: z.record(z.string(), z.string()).optional(),
});

// DNS monitor schema
const dnsSchema = baseSchema.extend({
	type: z.literal("dns"),
	url: z
		.string()
		.min(1, "Domain is required")
		.regex(hostnameRegex, "Enter a valid domain (e.g. www.example.com)"),
	dnsServer: z
		.string()
		.min(1, "DNS server is required")
		.refine(
			(v) => z.ipv4().safeParse(v).success || z.ipv6().safeParse(v).success,
			"Enter a valid IPv4 or IPv6 address (e.g. 8.8.8.8)"
		),
	dnsRecordType: z.enum(DnsRecordTypes),
});

// Discriminated union of all monitor types
export const monitorSchema = z.discriminatedUnion("type", [
	httpSchema,
	pingSchema,
	portSchema,
	dockerSchema,
	gameSchema,
	grpcSchema,
	pagespeedSchema,
	hardwareSchema,
	websocketSchema,
	dnsSchema,
	scriptSchema,
]);

export type MonitorFormData = z.infer<typeof monitorSchema>;

const optionForType = (type: MonitorType) =>
	monitorSchema.options.find((o) => o.shape.type.value === type);

// The step each field of a type is validated on, from the per-field
// `monitorStepRegistry` metadata (unannotated fields default to step 0).
const fieldStepsFor = (
	type: MonitorType
): [name: FieldPath<MonitorFormData>, step: number][] =>
	Object.entries(optionForType(type)?.shape ?? {}).map(([name, field]) => [
		name as FieldPath<MonitorFormData>,
		monitorStepRegistry.get(field)?.step ?? 0,
	]);

// The selected type's fields that belong to a given wizard step. Derived from
// the schema so it can't drift from the field definitions.
export const stepFieldsFor = (
	type: MonitorType,
	step: number
): FieldPath<MonitorFormData>[] =>
	fieldStepsFor(type)
		.filter(([, fieldStep]) => fieldStep === step)
		.map(([name]) => name);

// Number of wizard steps a type has, derived from the highest step its fields
// declare. A type with no step-2 fields is a 2-step form, and so on.
export const monitorStepCount = (type: MonitorType): number =>
	Math.max(0, ...fieldStepsFor(type).map(([, step]) => step)) + 1;

// Type-specific schemas exported for individual use
export {
	httpSchema,
	pingSchema,
	portSchema,
	dockerSchema,
	gameSchema,
	grpcSchema,
	pagespeedSchema,
	hardwareSchema,
	websocketSchema,
	scriptSchema,
};
