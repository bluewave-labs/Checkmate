import got, { type Got } from "got";
import bcrypt from "bcryptjs";
import type { Script, ScriptSummary, ScriptExecutionResult, ScriptRuntime } from "@/types/script.js";
import type { Monitor } from "@/types/monitor.js";
import {
	SCRIPT_MAX_EXECUTION_TIME_MS_DEFAULT,
	SCRIPT_MAX_EXECUTION_TIME_MS_HARD_CAP,
} from "@/types/script.js";
import { AppError } from "@/utils/AppError.js";
import { ILogger } from "@/utils/logger.js";
import {
	encryptScriptBody,
	decryptScriptBody,
	hashScriptBody,
	verifyScriptBodyHash,
} from "@/utils/scriptCrypto.js";
import {
	expandVariables,
	parseScriptOutput,
	severityFor,
	isUp,
	type ScriptSeverity,
	type ParsedScriptOutput,
} from "@/utils/scriptOutputParser.js";
import type {
	IScriptRepository,
	IProbeRepository,
	IAuditRepository,
	ICaptureAgentRepository,
	ICaptureAgentDeviceRepository,
} from "@/repositories/index.js";

const SERVICE_NAME = "scriptService";
const BCRYPT_ROUNDS = 12;

export interface CreateScriptInput {
	name: string;
	description?: string;
	runtime: ScriptRuntime;
	body: string;
	parameters?: Record<string, string>;
}

export interface UpdateScriptInput {
	name?: string;
	description?: string;
	runtime?: ScriptRuntime;
	body?: string;
	parameters?: Record<string, string>;
}

export interface RegisterProbeInput {
	name: string;
	url: string;
	probeSecret: string;
}

export interface IScriptService {
	readonly serviceName: string;
	createScript(teamId: string, userId: string, data: CreateScriptInput): Promise<Script>;
	getScript(teamId: string, scriptId: string): Promise<Script>;
	listScripts(teamId: string): Promise<ScriptSummary[]>;
	updateScript(teamId: string, userId: string, scriptId: string, data: UpdateScriptInput): Promise<Script>;
	deleteScript(teamId: string, userId: string, scriptId: string): Promise<void>;
	executeScriptForMonitor(monitor: Monitor): Promise<ScriptExecutionResult>;
	registerProbe(teamId: string, userId: string, data: RegisterProbeInput): Promise<{ id: string; name: string; url: string }>;
	listProbes(teamId: string): Promise<Array<{ id: string; name: string; url: string; isActive: boolean; lastSeen?: string }>>;
	deregisterProbe(teamId: string, userId: string, probeId: string): Promise<void>;
}

export class ScriptService implements IScriptService {
	static SERVICE_NAME = SERVICE_NAME;

	private readonly scriptRepository: IScriptRepository;
	private readonly probeRepository: IProbeRepository;
	private readonly auditRepository: IAuditRepository;
	private readonly captureAgentRepository?: ICaptureAgentRepository;
	private readonly captureAgentDeviceRepository?: ICaptureAgentDeviceRepository;
	private readonly logger: ILogger;
	private readonly httpClient: Got;

	constructor(deps: {
		scriptRepository: IScriptRepository;
		probeRepository: IProbeRepository;
		auditRepository: IAuditRepository;
		captureAgentRepository?: ICaptureAgentRepository;
		captureAgentDeviceRepository?: ICaptureAgentDeviceRepository;
		logger: ILogger;
		httpClient?: Got;
	}) {
		this.scriptRepository = deps.scriptRepository;
		this.probeRepository = deps.probeRepository;
		this.auditRepository = deps.auditRepository;
		this.captureAgentRepository = deps.captureAgentRepository;
		this.captureAgentDeviceRepository = deps.captureAgentDeviceRepository;
		this.logger = deps.logger;
		this.httpClient =
			deps.httpClient ??
			got.extend({
				timeout: { request: SCRIPT_MAX_EXECUTION_TIME_MS_HARD_CAP + 5_000 },
				retry: { limit: 0 },
				responseType: "json",
			});
	}

	get serviceName() {
		return ScriptService.SERVICE_NAME;
	}

	createScript = async (teamId: string, userId: string, data: CreateScriptInput): Promise<Script> => {
		const bodyHash = hashScriptBody(data.body);
		const encryptedBody = encryptScriptBody(data.body);
		const script = await this.scriptRepository.create({
			teamId,
			createdBy: userId,
			name: data.name,
			description: data.description,
			runtime: data.runtime,
			bodyHash,
			encryptedBody,
			parameters: data.parameters ?? {},
		});

		this.auditRepository
			.log({
				teamId,
				userId,
				action: "script.create",
				resourceType: "script",
				resourceId: script.id,
				metadata: { runtime: script.runtime, name: script.name },
			})
			.catch(() => undefined);

		this.logger.info({
			message: `Script created`,
			service: SERVICE_NAME,
			method: "createScript",
			details: { scriptId: script.id, teamId, runtime: script.runtime },
		});
		return script;
	};

	getScript = async (teamId: string, scriptId: string): Promise<Script> => {
		return this.scriptRepository.findById(scriptId, teamId);
	};

	listScripts = async (teamId: string): Promise<ScriptSummary[]> => {
		return this.scriptRepository.findByTeamId(teamId);
	};

	updateScript = async (teamId: string, userId: string, scriptId: string, data: UpdateScriptInput): Promise<Script> => {
		const update: {
			name?: string;
			description?: string;
			runtime?: ScriptRuntime;
			bodyHash?: string;
			encryptedBody?: string;
			parameters?: Record<string, string>;
		} = {};
		if (data.name !== undefined) update.name = data.name;
		if (data.description !== undefined) update.description = data.description;
		if (data.runtime !== undefined) update.runtime = data.runtime;
		if (data.parameters !== undefined) update.parameters = data.parameters;
		if (data.body !== undefined) {
			update.bodyHash = hashScriptBody(data.body);
			update.encryptedBody = encryptScriptBody(data.body);
		}
		const script = await this.scriptRepository.update(scriptId, teamId, update);

		this.auditRepository
			.log({
				teamId,
				userId,
				action: "script.update",
				resourceType: "script",
				resourceId: script.id,
				metadata: { runtime: script.runtime, bodyChanged: data.body !== undefined },
			})
			.catch(() => undefined);

		this.logger.info({
			message: `Script updated`,
			service: SERVICE_NAME,
			method: "updateScript",
			details: { scriptId: script.id, teamId },
		});
		return script;
	};

	deleteScript = async (teamId: string, userId: string, scriptId: string): Promise<void> => {
		await this.scriptRepository.delete(scriptId, teamId);
		this.auditRepository
			.log({
				teamId,
				userId,
				action: "script.delete",
				resourceType: "script",
				resourceId: scriptId,
			})
			.catch(() => undefined);
		this.logger.info({
			message: `Script deleted`,
			service: SERVICE_NAME,
			method: "deleteScript",
			details: { scriptId, teamId },
		});
	};

	registerProbe = async (
		teamId: string,
		userId: string,
		data: RegisterProbeInput
	): Promise<{ id: string; name: string; url: string }> => {
		const hashed = await bcrypt.hash(data.probeSecret, BCRYPT_ROUNDS);
		const probe = await this.probeRepository.register({
			teamId,
			name: data.name,
			url: data.url,
			probeSecretHashed: hashed,
		});
		this.auditRepository
			.log({
				teamId,
				userId,
				action: "probe.register",
				resourceType: "probe",
				resourceId: probe.id,
				metadata: { name: probe.name, url: probe.url },
			})
			.catch(() => undefined);
		return { id: probe.id, name: probe.name, url: probe.url };
	};

	listProbes = async (teamId: string) => {
		const probes = await this.probeRepository.findByTeamId(teamId);
		return probes.map((p) => ({ id: p.id, name: p.name, url: p.url, isActive: p.isActive, lastSeen: p.lastSeen }));
	};

	deregisterProbe = async (teamId: string, userId: string, probeId: string): Promise<void> => {
		await this.probeRepository.deactivate(probeId, teamId);
		this.auditRepository
			.log({
				teamId,
				userId,
				action: "probe.deregister",
				resourceType: "probe",
				resourceId: probeId,
			})
			.catch(() => undefined);
	};

	executeScriptForMonitor = async (monitor: Monitor): Promise<ScriptExecutionResult> => {
		if (monitor.type !== "script") {
			throw new AppError({
				message: `Monitor ${monitor.id} is not a script monitor`,
				service: SERVICE_NAME,
				method: "executeScriptForMonitor",
				status: 400,
			});
		}
		if (!monitor.scriptId) {
			throw new AppError({
				message: `Monitor ${monitor.id} has no scriptId`,
				service: SERVICE_NAME,
				method: "executeScriptForMonitor",
				status: 400,
			});
		}
		const script = await this.scriptRepository.findById(monitor.scriptId, monitor.teamId);
		const plaintext = decryptScriptBody(script.encryptedBody);

		if (!verifyScriptBodyHash(plaintext, script.bodyHash)) {
			this.logger.error({
				message: `Script body hash mismatch – tamper detected`,
				service: SERVICE_NAME,
				method: "executeScriptForMonitor",
				details: { scriptId: script.id, monitorId: monitor.id },
			});
			throw new AppError({
				message: "Script integrity check failed",
				service: SERVICE_NAME,
				method: "executeScriptForMonitor",
				status: 500,
			});
		}

		const mergedParameters: Record<string, string> = {
			...(script.parameters ?? {}),
			...(monitor.scriptParameterOverrides ?? {}),
		};
		const timeoutMs = Math.min(
			Math.max(monitor.scriptMaxExecutionTimeMs ?? SCRIPT_MAX_EXECUTION_TIME_MS_DEFAULT, 1000),
			SCRIPT_MAX_EXECUTION_TIME_MS_HARD_CAP
		);

		const { targetUrl, authToken } = await this.resolveTarget(monitor);

		// Build a variable map and expand %% placeholders before sending the
		// body to the agent. Override values from the monitor parameter map
		// take priority over the static variables we know about.
		const vars: Record<string, string> = {
			devicename: monitor.name,
			monitorname: monitor.name,
			hostname: this.safeHostname(monitor.url, monitor.name),
			ip: "",
			teamname: "",
			datetime: new Date().toISOString(),
			captureagent: targetUrl,
			runtime: script.runtime,
		};

		if (monitor.captureAgentId && this.captureAgentRepository) {
			const agent = await this.captureAgentRepository.findById(monitor.captureAgentId);
			if (agent) {
				vars.captureagent = agent.url;
			}
		}
		if (monitor.deviceId && this.captureAgentDeviceRepository) {
			const device = await this.captureAgentDeviceRepository.findById(monitor.deviceId);
			if (device) {
				vars.devicename = device.name;
				vars.hostname = device.hostname;
				vars.ip = device.ipAddress ?? "";
			}
		}
		// Parameter overrides feed the variable map too, so admins can inject
		// arbitrary per-monitor strings into the script body.
		for (const [key, value] of Object.entries(monitor.scriptParameterOverrides ?? {})) {
			vars[key.toLowerCase()] = String(value);
		}

		const expandedBody = expandVariables(plaintext, vars);

		const body = {
			script_id: script.id,
			runtime: script.runtime,
			body: expandedBody,
			timeout_ms: timeoutMs,
			parameters: mergedParameters,
		};

		const startedAt = Date.now();
		try {
			const response = await this.httpClient.post<{
				exit_code: number;
				stdout: string;
				stderr: string;
				execution_time_ms: number;
				timed_out: boolean;
			}>(`${targetUrl.replace(/\/$/, "")}/api/v1/script`, {
				json: body,
				headers: { Authorization: `Bearer ${authToken}` },
				timeout: { request: timeoutMs + 10_000 },
			});
			const data = response.body;
			const baseResult: ScriptExecutionResult = {
				exitCode: data.exit_code,
				stdout: data.stdout ?? "",
				stderr: data.stderr ?? "",
				executionTimeMs: data.execution_time_ms ?? 0,
				timedOut: Boolean(data.timed_out),
			};
			const enriched = this.enrichExecutionResult(baseResult, monitor);

			// Audit: log only IDs and metadata; never script body or stdout content
			this.auditRepository
				.log({
					teamId: monitor.teamId,
					userId: monitor.userId,
					action: "script.execute",
					resourceType: "script",
					resourceId: script.id,
					metadata: {
						monitorId: monitor.id,
						runtime: script.runtime,
						exitCode: enriched.exitCode,
						executionTimeMs: enriched.executionTimeMs,
						timedOut: enriched.timedOut,
						parsedStatus: enriched.parsedStatus,
						severity: enriched.severity,
					},
				})
				.catch(() => undefined);

			this.logger.debug({
				message: `Script executed`,
				service: SERVICE_NAME,
				method: "executeScriptForMonitor",
				details: {
					scriptId: script.id,
					monitorId: monitor.id,
					runtime: script.runtime,
					executionTimeMs: enriched.executionTimeMs,
					exitCode: enriched.exitCode,
					parsedStatus: enriched.parsedStatus,
				},
			});

			return enriched;
		} catch (error: unknown) {
			const elapsed = Date.now() - startedAt;
			this.logger.warn({
				message: `Script execution failed: ${error instanceof Error ? error.message : "unknown error"}`,
				service: SERVICE_NAME,
				method: "executeScriptForMonitor",
				details: { scriptId: script.id, monitorId: monitor.id, runtime: script.runtime, elapsedMs: elapsed },
			});
			return this.enrichExecutionResult(
				{
					exitCode: -1,
					stdout: "",
					stderr: error instanceof Error ? error.message : "Unknown error",
					executionTimeMs: elapsed,
					timedOut: elapsed >= timeoutMs,
				},
				monitor
			);
		}
	};

	private enrichExecutionResult = (result: ScriptExecutionResult, monitor: Monitor): ScriptExecutionResult => {
		const parsed: ParsedScriptOutput = parseScriptOutput(result.stdout ?? "");
		let statusBoolean: boolean;
		let severity: ScriptSeverity;

		if (parsed.statusLine) {
			statusBoolean = isUp(parsed.statusLine.status, monitor.warningCountsAsDown ?? false);
			severity = severityFor(parsed.statusLine.status);
		} else {
			statusBoolean = result.exitCode === (monitor.scriptExitCodeSuccess ?? 0) && !result.timedOut;
			severity = statusBoolean ? "success" : "error";
		}

		return {
			...result,
			parsedStatus: parsed.statusLine?.status,
			parsedTarget: parsed.statusLine?.target,
			parsedMessage: parsed.statusLine?.message,
			severity,
			datapoints: parsed.datapoints,
			statusBoolean,
		};
	};

	private safeHostname = (urlOrHost: string, fallback: string): string => {
		try {
			const u = new URL(urlOrHost);
			return u.hostname;
		} catch {
			return urlOrHost?.length > 0 ? urlOrHost : fallback;
		}
	};

	private resolveTarget = async (monitor: Monitor): Promise<{ targetUrl: string; authToken: string }> => {
		// Preferred path: monitor references a CaptureAgent. The token is
		// retrieved from the encrypted store so it is never persisted alongside
		// the monitor in plaintext.
		if (monitor.captureAgentId && this.captureAgentRepository) {
			const agent = await this.captureAgentRepository.findById(monitor.captureAgentId);
			if (!agent) {
				throw new AppError({
					message: `Capture agent ${monitor.captureAgentId} not found`,
					service: SERVICE_NAME,
					method: "resolveTarget",
					status: 404,
				});
			}
			if (!agent.isActive) {
				throw new AppError({
					message: "Capture agent is not active",
					service: SERVICE_NAME,
					method: "resolveTarget",
					status: 400,
				});
			}
			const authToken = agent.agentTokenCipher ? decryptScriptBody(agent.agentTokenCipher) : monitor.secret ?? "";
			return { targetUrl: agent.url, authToken };
		}

		// Legacy capture target: the monitor URL is the agent endpoint and
		// the secret travels on the monitor itself. Retained for backward
		// compatibility with pre-migration monitors.
		if (monitor.scriptExecutionTarget === "capture") {
			return {
				targetUrl: monitor.url,
				authToken: monitor.secret ?? "",
			};
		}

		if (monitor.scriptExecutionTarget === "probe") {
			if (!monitor.probeId) {
				throw new AppError({
					message: "Probe ID is required for probe execution target",
					service: SERVICE_NAME,
					method: "resolveTarget",
					status: 400,
				});
			}
			const probe = await this.probeRepository.findById(monitor.probeId, monitor.teamId);
			if (!probe.isActive) {
				throw new AppError({
					message: "Probe server is not active",
					service: SERVICE_NAME,
					method: "resolveTarget",
					status: 400,
				});
			}
			// The probeSecret stored is a bcrypt hash; we cannot recover the
			// original. The monitor must therefore carry the secret as its
			// `secret` field (encrypted server-side, configured by the admin
			// when the probe is registered). The hash is used only to verify
			// inbound probe-initiated requests.
			return {
				targetUrl: probe.url,
				authToken: monitor.secret ?? "",
			};
		}
		throw new AppError({
			message: "Invalid scriptExecutionTarget",
			service: SERVICE_NAME,
			method: "resolveTarget",
			status: 400,
		});
	};
}
