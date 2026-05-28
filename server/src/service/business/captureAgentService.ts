import got, { type Got } from "got";
import bcrypt from "bcryptjs";
import type {
	CaptureAgent,
	CaptureAgentPublic,
	CaptureAgentDevice,
	CaptureAgentDevicePublic,
	CaptureAgentHealth,
	DeviceOS,
	DeviceAuthType,
} from "@/types/captureAgent.js";
import { AppError } from "@/utils/AppError.js";
import { ILogger } from "@/utils/logger.js";
import { encryptScriptBody, decryptScriptBody } from "@/utils/scriptCrypto.js";
import type { ICaptureAgentRepository, ICaptureAgentDeviceRepository, IAuditRepository } from "@/repositories/index.js";

const SERVICE_NAME = "captureAgentService";
const BCRYPT_ROUNDS = 12;
const HEALTH_TIMEOUT_MS = 5000;

export interface RegisterCaptureAgentInput {
	name: string;
	url: string;
	plainSecret: string;
	canCollectMetrics: boolean;
	canExecuteScripts: boolean;
	tags?: string[];
}

export interface UpdateCaptureAgentInput {
	name?: string;
	url?: string;
	plainSecret?: string;
	canCollectMetrics?: boolean;
	canExecuteScripts?: boolean;
	tags?: string[];
	isActive?: boolean;
}

export interface AddCaptureAgentDeviceInput {
	name: string;
	hostname: string;
	ipAddress?: string;
	os: DeviceOS;
	authType: DeviceAuthType;
	username?: string;
	plainPassword?: string;
	sshKeyFingerprint?: string;
	port?: number;
	tags?: string[];
}

export interface UpdateCaptureAgentDeviceInput {
	name?: string;
	hostname?: string;
	ipAddress?: string;
	os?: DeviceOS;
	authType?: DeviceAuthType;
	username?: string;
	plainPassword?: string;
	sshKeyFingerprint?: string;
	port?: number;
	tags?: string[];
}

export interface ICaptureAgentService {
	readonly serviceName: string;
	registerAgent(teamId: string, userId: string, input: RegisterCaptureAgentInput): Promise<CaptureAgentPublic>;
	listAgents(teamId: string): Promise<CaptureAgentPublic[]>;
	getAgent(teamId: string, agentId: string): Promise<CaptureAgentPublic>;
	updateAgent(teamId: string, userId: string, agentId: string, patch: UpdateCaptureAgentInput): Promise<CaptureAgentPublic>;
	deleteAgent(teamId: string, userId: string, agentId: string): Promise<void>;
	checkHealth(teamId: string, agentId: string): Promise<CaptureAgentHealth>;
	getPlainToken(agentId: string): Promise<string>;
	addDevice(teamId: string, userId: string, agentId: string, input: AddCaptureAgentDeviceInput): Promise<CaptureAgentDevicePublic>;
	listDevices(teamId: string, agentId: string): Promise<CaptureAgentDevicePublic[]>;
	updateDevice(
		teamId: string,
		userId: string,
		agentId: string,
		deviceId: string,
		patch: UpdateCaptureAgentDeviceInput
	): Promise<CaptureAgentDevicePublic>;
	deleteDevice(teamId: string, userId: string, agentId: string, deviceId: string): Promise<void>;
	getDeviceInternal(deviceId: string): Promise<CaptureAgentDevice | null>;
}

const toPublicAgent = (agent: CaptureAgent): CaptureAgentPublic => {
	// Strip secrets so they never leave the boundary.
	const result: CaptureAgentPublic = {
		id: agent.id,
		teamId: agent.teamId,
		name: agent.name,
		url: agent.url,
		isActive: agent.isActive,
		canCollectMetrics: agent.canCollectMetrics,
		canExecuteScripts: agent.canExecuteScripts,
		lastSeen: agent.lastSeen,
		tags: agent.tags,
		createdAt: agent.createdAt,
		updatedAt: agent.updatedAt,
	};
	return result;
};

const toPublicDevice = (device: CaptureAgentDevice): CaptureAgentDevicePublic => {
	const hasCredentials = Boolean(device.encryptedPassword) || Boolean(device.sshKeyFingerprint);
	return {
		id: device.id,
		captureAgentId: device.captureAgentId,
		teamId: device.teamId,
		name: device.name,
		hostname: device.hostname,
		ipAddress: device.ipAddress,
		os: device.os,
		authType: device.authType,
		sshKeyFingerprint: device.sshKeyFingerprint,
		port: device.port,
		tags: device.tags,
		createdAt: device.createdAt,
		updatedAt: device.updatedAt,
		hasCredentials,
	};
};

export class CaptureAgentService implements ICaptureAgentService {
	static SERVICE_NAME = SERVICE_NAME;

	private readonly captureAgentRepository: ICaptureAgentRepository;
	private readonly captureAgentDeviceRepository: ICaptureAgentDeviceRepository;
	private readonly auditRepository: IAuditRepository;
	private readonly logger: ILogger;
	private readonly httpClient: Got;

	constructor(deps: {
		captureAgentRepository: ICaptureAgentRepository;
		captureAgentDeviceRepository: ICaptureAgentDeviceRepository;
		auditRepository: IAuditRepository;
		logger: ILogger;
		httpClient?: Got;
	}) {
		this.captureAgentRepository = deps.captureAgentRepository;
		this.captureAgentDeviceRepository = deps.captureAgentDeviceRepository;
		this.auditRepository = deps.auditRepository;
		this.logger = deps.logger;
		this.httpClient =
			deps.httpClient ??
			got.extend({
				timeout: { request: HEALTH_TIMEOUT_MS },
				retry: { limit: 0 },
				responseType: "json",
			});
	}

	get serviceName(): string {
		return CaptureAgentService.SERVICE_NAME;
	}

	private requireAgent = async (teamId: string, agentId: string): Promise<CaptureAgent> => {
		const agent = await this.captureAgentRepository.findByIdAndTeam(agentId, teamId);
		if (!agent) {
			throw new AppError({
				message: `Capture agent ${agentId} not found`,
				status: 404,
				service: SERVICE_NAME,
				method: "requireAgent",
			});
		}
		return agent;
	};

	registerAgent = async (teamId: string, userId: string, input: RegisterCaptureAgentInput): Promise<CaptureAgentPublic> => {
		const secret = await bcrypt.hash(input.plainSecret, BCRYPT_ROUNDS);
		const agentTokenCipher = encryptScriptBody(input.plainSecret);
		const created = await this.captureAgentRepository.create({
			teamId,
			name: input.name,
			url: input.url,
			secret,
			agentTokenCipher,
			canCollectMetrics: input.canCollectMetrics,
			canExecuteScripts: input.canExecuteScripts,
			tags: input.tags,
		});

		this.auditRepository
			.log({
				teamId,
				userId,
				action: "captureAgent.register",
				resourceType: "captureAgent",
				resourceId: created.id,
				metadata: {
					name: created.name,
					url: created.url,
					canCollectMetrics: created.canCollectMetrics,
					canExecuteScripts: created.canExecuteScripts,
				},
			})
			.catch(() => undefined);

		this.logger.info({
			message: "Capture agent registered",
			service: SERVICE_NAME,
			method: "registerAgent",
			details: { teamId, agentId: created.id },
		});
		return toPublicAgent(created);
	};

	listAgents = async (teamId: string): Promise<CaptureAgentPublic[]> => {
		const agents = await this.captureAgentRepository.findByTeam(teamId);
		return agents.map(toPublicAgent);
	};

	getAgent = async (teamId: string, agentId: string): Promise<CaptureAgentPublic> => {
		const agent = await this.requireAgent(teamId, agentId);
		return toPublicAgent(agent);
	};

	updateAgent = async (teamId: string, userId: string, agentId: string, patch: UpdateCaptureAgentInput): Promise<CaptureAgentPublic> => {
		await this.requireAgent(teamId, agentId);
		const update: Partial<{
			name: string;
			url: string;
			secret: string;
			agentTokenCipher: string;
			canCollectMetrics: boolean;
			canExecuteScripts: boolean;
			tags: string[];
			isActive: boolean;
		}> = {};
		if (patch.name !== undefined) update.name = patch.name;
		if (patch.url !== undefined) update.url = patch.url;
		if (patch.canCollectMetrics !== undefined) update.canCollectMetrics = patch.canCollectMetrics;
		if (patch.canExecuteScripts !== undefined) update.canExecuteScripts = patch.canExecuteScripts;
		if (patch.tags !== undefined) update.tags = patch.tags;
		if (patch.isActive !== undefined) update.isActive = patch.isActive;
		if (patch.plainSecret !== undefined) {
			update.secret = await bcrypt.hash(patch.plainSecret, BCRYPT_ROUNDS);
			update.agentTokenCipher = encryptScriptBody(patch.plainSecret);
		}

		const updated = await this.captureAgentRepository.updateById(agentId, update);

		this.auditRepository
			.log({
				teamId,
				userId,
				action: "captureAgent.update",
				resourceType: "captureAgent",
				resourceId: agentId,
				metadata: { fields: Object.keys(update) },
			})
			.catch(() => undefined);

		this.logger.info({
			message: "Capture agent updated",
			service: SERVICE_NAME,
			method: "updateAgent",
			details: { teamId, agentId, fields: Object.keys(update) },
		});
		return toPublicAgent(updated);
	};

	deleteAgent = async (teamId: string, userId: string, agentId: string): Promise<void> => {
		await this.requireAgent(teamId, agentId);
		const removedDevices = await this.captureAgentDeviceRepository.deleteByAgent(agentId);
		await this.captureAgentRepository.deleteById(agentId);
		this.auditRepository
			.log({
				teamId,
				userId,
				action: "captureAgent.delete",
				resourceType: "captureAgent",
				resourceId: agentId,
				metadata: { removedDevices },
			})
			.catch(() => undefined);

		this.logger.info({
			message: "Capture agent deleted",
			service: SERVICE_NAME,
			method: "deleteAgent",
			details: { teamId, agentId, removedDevices },
		});
	};

	checkHealth = async (teamId: string, agentId: string): Promise<CaptureAgentHealth> => {
		const agent = await this.requireAgent(teamId, agentId);
		const targetUrl = `${agent.url.replace(/\/$/, "")}/health`;
		const startedAt = Date.now();
		try {
			const response = await this.httpClient.get<{
				version?: string;
				capabilities?: { metrics?: boolean; scripts?: boolean };
			}>(targetUrl, { timeout: { request: HEALTH_TIMEOUT_MS } });
			const latencyMs = Date.now() - startedAt;
			await this.captureAgentRepository.touchLastSeen(agentId);
			return {
				reachable: true,
				version: response.body?.version,
				capabilities: {
					metrics: Boolean(response.body?.capabilities?.metrics ?? agent.canCollectMetrics),
					scripts: Boolean(response.body?.capabilities?.scripts ?? agent.canExecuteScripts),
				},
				latencyMs,
			};
		} catch (error) {
			this.logger.warn({
				message: `Capture agent health check failed: ${error instanceof Error ? error.message : "unknown"}`,
				service: SERVICE_NAME,
				method: "checkHealth",
				details: { agentId, teamId },
			});
			return { reachable: false };
		}
	};

	getPlainToken = async (agentId: string): Promise<string> => {
		const agent = await this.captureAgentRepository.findById(agentId);
		if (!agent) {
			throw new AppError({
				message: `Capture agent ${agentId} not found`,
				status: 404,
				service: SERVICE_NAME,
				method: "getPlainToken",
			});
		}
		if (!agent.agentTokenCipher) {
			throw new AppError({
				message: `Capture agent ${agentId} has no stored token`,
				status: 500,
				service: SERVICE_NAME,
				method: "getPlainToken",
			});
		}
		return decryptScriptBody(agent.agentTokenCipher);
	};

	addDevice = async (teamId: string, userId: string, agentId: string, input: AddCaptureAgentDeviceInput): Promise<CaptureAgentDevicePublic> => {
		await this.requireAgent(teamId, agentId);
		const encryptedPassword = input.plainPassword ? encryptScriptBody(input.plainPassword) : undefined;
		const device = await this.captureAgentDeviceRepository.create({
			captureAgentId: agentId,
			teamId,
			name: input.name,
			hostname: input.hostname,
			ipAddress: input.ipAddress,
			os: input.os,
			authType: input.authType,
			username: input.username,
			encryptedPassword,
			sshKeyFingerprint: input.sshKeyFingerprint,
			port: input.port,
			tags: input.tags,
		});
		this.auditRepository
			.log({
				teamId,
				userId,
				action: "captureAgentDevice.add",
				resourceType: "captureAgentDevice",
				resourceId: device.id,
				metadata: { agentId, name: device.name, hostname: device.hostname, authType: device.authType },
			})
			.catch(() => undefined);
		this.logger.info({
			message: "Capture agent device added",
			service: SERVICE_NAME,
			method: "addDevice",
			details: { agentId, deviceId: device.id, teamId },
		});
		return toPublicDevice(device);
	};

	listDevices = async (teamId: string, agentId: string): Promise<CaptureAgentDevicePublic[]> => {
		await this.requireAgent(teamId, agentId);
		const devices = await this.captureAgentDeviceRepository.findByAgent(agentId);
		return devices.map(toPublicDevice);
	};

	updateDevice = async (
		teamId: string,
		userId: string,
		agentId: string,
		deviceId: string,
		patch: UpdateCaptureAgentDeviceInput
	): Promise<CaptureAgentDevicePublic> => {
		await this.requireAgent(teamId, agentId);
		const device = await this.captureAgentDeviceRepository.findByIdAndTeam(deviceId, teamId);
		if (!device || device.captureAgentId !== agentId) {
			throw new AppError({
				message: `Device ${deviceId} not found for agent ${agentId}`,
				status: 404,
				service: SERVICE_NAME,
				method: "updateDevice",
			});
		}
		const update: Record<string, unknown> = {};
		if (patch.name !== undefined) update.name = patch.name;
		if (patch.hostname !== undefined) update.hostname = patch.hostname;
		if (patch.ipAddress !== undefined) update.ipAddress = patch.ipAddress;
		if (patch.os !== undefined) update.os = patch.os;
		if (patch.authType !== undefined) update.authType = patch.authType;
		if (patch.username !== undefined) update.username = patch.username;
		if (patch.sshKeyFingerprint !== undefined) update.sshKeyFingerprint = patch.sshKeyFingerprint;
		if (patch.port !== undefined) update.port = patch.port;
		if (patch.tags !== undefined) update.tags = patch.tags;
		if (patch.plainPassword !== undefined) {
			update.encryptedPassword = patch.plainPassword.length > 0 ? encryptScriptBody(patch.plainPassword) : undefined;
		}

		const updated = await this.captureAgentDeviceRepository.updateById(deviceId, update);
		this.auditRepository
			.log({
				teamId,
				userId,
				action: "captureAgentDevice.update",
				resourceType: "captureAgentDevice",
				resourceId: deviceId,
				metadata: { agentId, fields: Object.keys(update) },
			})
			.catch(() => undefined);
		return toPublicDevice(updated);
	};

	deleteDevice = async (teamId: string, userId: string, agentId: string, deviceId: string): Promise<void> => {
		await this.requireAgent(teamId, agentId);
		const device = await this.captureAgentDeviceRepository.findByIdAndTeam(deviceId, teamId);
		if (!device || device.captureAgentId !== agentId) {
			throw new AppError({
				message: `Device ${deviceId} not found for agent ${agentId}`,
				status: 404,
				service: SERVICE_NAME,
				method: "deleteDevice",
			});
		}
		await this.captureAgentDeviceRepository.deleteById(deviceId);
		this.auditRepository
			.log({
				teamId,
				userId,
				action: "captureAgentDevice.delete",
				resourceType: "captureAgentDevice",
				resourceId: deviceId,
				metadata: { agentId },
			})
			.catch(() => undefined);
	};

	getDeviceInternal = async (deviceId: string): Promise<CaptureAgentDevice | null> => {
		return this.captureAgentDeviceRepository.findById(deviceId);
	};
}
