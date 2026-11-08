import crypto from "node:crypto";
import type { Mongoose } from "mongoose";
import type { IDb } from "@/db/db.interface.js";
import type { IEncryptionService } from "@/service/encryption/encryptionService.js";
import type { ILogger } from "@/utils/logger/logger.js";
import { ConnectBackup } from "@/domain/connect/connect.backup.js";
import { ConnectHeartbeat } from "@/domain/connect/connect.heartbeat.js";
import type { IConnectRepository } from "@/domain/connect/connect.repository.js";
import { ConnectTunnel } from "@/domain/connect/connect.tunnel.js";
import { emptyConnectState, type ConnectBackupKind, type ConnectState } from "@/domain/connect/connect.type.js";

const SERVICE_NAME = "ConnectService";
const SCHEDULE_SWEEP_MS = 60_000;
const ENCRYPTED_PREFIX = "v1.";
const MONGOOSE_CONNECTED = 1;

export const DEFAULT_CONNECT_HOSTS = ["connect.checkmate.so", "relay.checkmate.so"];

export type ConnectResult = { status: number; data: Record<string, unknown> };

export type ConnectOptions = {
	localTarget: string;
	version: string;
	mongoUrl: string;
	allowedHosts: string[];
	apiBaseOverride: string | null;
	mongodumpBin: string;
	mongorestoreBin: string;
};

type ConnectDeps = {
	repository: IConnectRepository;
	encryptionService: IEncryptionService;
	db: IDb<Mongoose>;
	logger: ILogger;
	options: ConnectOptions;
};

export type ConnectEnrollInput = { connectUrl: string; agentId: string; token: string; apiUrl?: string };

export interface IConnectService {
	start(): Promise<void>;
	stop(): void;
	getStatus(): ConnectResult;
	enroll(input: ConnectEnrollInput): Promise<ConnectResult>;
	setRemoteAccess(enabled: boolean): Promise<ConnectResult>;
	unenroll(): Promise<ConnectResult>;
	getBackupStatus(): ConnectResult;
	listBackups(): Promise<ConnectResult>;
	createRecoveryKey(): Promise<ConnectResult>;
	runBackup(kind?: ConnectBackupKind): ConnectResult;
	restoreBackup(backupId: string): ConnectResult;
	setBackupSchedule(input: { enabled: boolean; intervalHours?: number; kind?: ConnectBackupKind }): Promise<ConnectResult>;
}

export const isConnectHostAllowed = (connectUrl: string, allowedHosts: string[]) => {
	try {
		const host = new URL(connectUrl.replace(/^wss:/, "https:")).hostname;
		return allowedHosts.some((suffix) => (suffix.startsWith(".") ? host.endsWith(suffix) : host === suffix));
	} catch {
		return false;
	}
};

export class ConnectService implements IConnectService {
	static SERVICE_NAME = SERVICE_NAME;

	private log: ILogger;
	private repository: IConnectRepository;
	private encryptionService: IEncryptionService;
	private db: IDb<Mongoose>;
	private options: ConnectOptions;
	private state: ConnectState = emptyConnectState();
	private tunnel: ConnectTunnel;
	private heartbeat: ConnectHeartbeat;
	private backups: ConnectBackup;
	private sweepTimer: NodeJS.Timeout | null = null;
	// When stored state can't be read, writing would overwrite the real
	// enrollment or recovery key, so every change is refused until a restart.
	private loadFailed = false;
	private creatingRecoveryKey = false;

	constructor({ repository, encryptionService, db, logger, options }: ConnectDeps) {
		this.log = logger.child({ service: SERVICE_NAME });
		this.repository = repository;
		this.encryptionService = encryptionService;
		this.db = db;
		this.options = options;
		this.tunnel = new ConnectTunnel(options.localTarget, this.log);
		this.heartbeat = new ConnectHeartbeat({
			version: options.version,
			tunnelConnected: () => this.tunnel.status().connected,
			isHealthy: this.isDatabaseConnected,
			log: this.log,
		});
		this.backups = new ConnectBackup({
			mongoUrl: options.mongoUrl,
			getDbName: this.getDbName,
			mongodumpBin: options.mongodumpBin,
			mongorestoreBin: options.mongorestoreBin,
			apiBaseOverride: options.apiBaseOverride,
			log: this.log,
		});
	}

	private isDatabaseConnected = async () => {
		try {
			return (await this.db.getConnection()).connection.readyState === MONGOOSE_CONNECTED;
		} catch {
			return false;
		}
	};

	private getDbName = async () => (await this.db.getConnection()).connection.name;

	// A failure here must never stop Checkmate from starting: Connect simply
	// stays inactive and the error is logged.
	start = async () => {
		try {
			const stored = await this.repository.load();
			if (stored) this.state = this.reveal(stored);
			if (stored && this.needsEncryptionUpdate(stored)) await this.repository.save(this.protect(this.state));
			this.applyState();
			this.sweepTimer = setInterval(() => {
				this.sweepSchedule().catch((error: unknown) => {
					this.log.error({ err: error }, "Connect backup schedule sweep failed");
				});
			}, SCHEDULE_SWEEP_MS);
			this.sweepTimer.unref();
		} catch (error) {
			this.state = emptyConnectState();
			this.loadFailed = true;
			this.log.error({ err: error }, "Connect could not load its state and stays inactive");
		}
	};

	private stateUnavailable = (): ConnectResult => ({
		status: 503,
		data: { error: "Connect state could not be loaded. Check ENCRYPTION_KEY and the server logs." },
	});

	stop = () => {
		if (this.sweepTimer) clearInterval(this.sweepTimer);
		this.sweepTimer = null;
		this.tunnel.stop();
		this.heartbeat.stop();
	};

	// ---- Secrets at rest ----
	// Encrypted whenever ENCRYPTION_KEY is configured, matching Checkmate's
	// other optional encrypted fields.

	private encryptSecret = (value: string) => (this.encryptionService.isConfigured() ? this.encryptionService.encrypt(value) : value);
	private decryptSecret = (value: string) => (value.startsWith(ENCRYPTED_PREFIX) ? this.encryptionService.decrypt(value) : value);

	private protect = (state: ConnectState): ConnectState => ({
		...state,
		enrollment: state.enrollment ? { ...state.enrollment, token: this.encryptSecret(state.enrollment.token) } : null,
		recoveryKey: state.recoveryKey ? this.encryptSecret(state.recoveryKey) : null,
	});

	private reveal = (state: ConnectState): ConnectState => ({
		...state,
		enrollment: state.enrollment ? { ...state.enrollment, token: this.decryptSecret(state.enrollment.token) } : null,
		recoveryKey: state.recoveryKey ? this.decryptSecret(state.recoveryKey) : null,
	});

	private needsEncryptionUpdate = (stored: ConnectState) => {
		if (!this.encryptionService.isConfigured()) return false;
		return [stored.enrollment?.token, stored.recoveryKey].some(
			(value) => value && (!value.startsWith(ENCRYPTED_PREFIX) || this.encryptionService.needsReencryption(value))
		);
	};

	private commit = async (next: ConnectState) => {
		await this.repository.save(this.protect(next));
		this.state = next;
	};

	private applyState = () => {
		const { enrollment, remoteAccessEnabled } = this.state;
		if (enrollment && remoteAccessEnabled) this.tunnel.start(enrollment);
		else this.tunnel.stop();

		if (enrollment) this.heartbeat.start(enrollment);
		else this.heartbeat.stop();
	};

	private publicState = () => {
		const { enrollment, remoteAccessEnabled, recoveryKey, schedule } = this.state;
		return {
			enrolled: !!enrollment,
			agentId: enrollment?.agentId ?? null,
			connectUrl: enrollment?.connectUrl ?? null,
			apiUrl: enrollment?.apiUrl ?? null,
			remoteAccess: { enabled: remoteAccessEnabled },
			backup: { recoveryKeySet: !!recoveryKey, schedule },
		};
	};

	private publicResult = (): ConnectResult => ({ status: 200, data: this.publicState() });

	getStatus = (): ConnectResult => ({
		status: 200,
		data: { ...this.publicState(), tunnel: this.tunnel.status(), agentVersion: this.options.version },
	});

	enroll = async ({ connectUrl, agentId, token, apiUrl }: ConnectEnrollInput): Promise<ConnectResult> => {
		if (this.loadFailed) return this.stateUnavailable();
		const { allowedHosts } = this.options;
		if (!isConnectHostAllowed(connectUrl, allowedHosts) || (apiUrl && !isConnectHostAllowed(apiUrl, allowedHosts))) {
			return { status: 400, data: { error: "connect host not allowed" } };
		}
		await this.commit({ ...this.state, enrollment: { connectUrl, agentId, token, apiUrl: apiUrl ?? null } });
		this.applyState();
		return this.publicResult();
	};

	setRemoteAccess = async (enabled: boolean): Promise<ConnectResult> => {
		if (this.loadFailed) return this.stateUnavailable();
		if (enabled && !this.state.enrollment) return { status: 409, data: { error: "not enrolled" } };
		await this.commit({ ...this.state, remoteAccessEnabled: enabled });
		this.applyState();
		return this.publicResult();
	};

	unenroll = async (): Promise<ConnectResult> => {
		if (this.loadFailed) return this.stateUnavailable();
		await this.commit({ ...this.state, enrollment: null, remoteAccessEnabled: false });
		this.applyState();
		return this.publicResult();
	};

	getBackupStatus = (): ConnectResult => ({ status: 200, data: this.backups.status() });

	listBackups = async (): Promise<ConnectResult> => {
		if (!this.state.enrollment) return { status: 409, data: { error: "not enrolled" } };
		try {
			return { status: 200, data: await this.backups.list(this.state.enrollment) };
		} catch (error) {
			return { status: 502, data: { error: error instanceof Error ? error.message : "control plane unreachable" } };
		}
	};

	// Generated once and returned once; without it the cloud copies cannot be
	// decrypted, so the caller must have the operator store it safely.
	createRecoveryKey = async (): Promise<ConnectResult> => {
		if (this.loadFailed) return this.stateUnavailable();
		if (this.state.recoveryKey || this.creatingRecoveryKey) {
			return { status: 409, data: { error: "recovery key already set" } };
		}
		this.creatingRecoveryKey = true;
		try {
			const recoveryKey = crypto.randomBytes(32).toString("hex");
			await this.commit({ ...this.state, recoveryKey });
			return { status: 200, data: { recoveryKey, format: "CMKB1" } };
		} finally {
			this.creatingRecoveryKey = false;
		}
	};

	runBackup = (kind: ConnectBackupKind = "full"): ConnectResult => {
		const { enrollment, recoveryKey } = this.state;
		if (!enrollment) return { status: 409, data: { error: "not enrolled" } };
		if (!recoveryKey) return { status: 409, data: { error: "no recovery key set" } };
		const result = this.backups.start({ enrollment, recoveryKeyHex: recoveryKey, kind });
		return { status: result.started ? 202 : 409, data: result };
	};

	// Destructive (mongorestore --drop); the UI confirms with the operator.
	restoreBackup = (backupId: string): ConnectResult => {
		const { enrollment, recoveryKey } = this.state;
		if (!enrollment) return { status: 409, data: { error: "not enrolled" } };
		if (!recoveryKey) return { status: 409, data: { error: "restores need the original recovery key" } };
		const result = this.backups.startRestore({ enrollment, recoveryKeyHex: recoveryKey, backupId });
		return { status: result.started ? 202 : 409, data: result };
	};

	setBackupSchedule = async ({
		enabled,
		intervalHours = 24,
		kind = "full",
	}: {
		enabled: boolean;
		intervalHours?: number;
		kind?: ConnectBackupKind;
	}): Promise<ConnectResult> => {
		if (this.loadFailed) return this.stateUnavailable();
		if (enabled && !this.state.recoveryKey) return { status: 409, data: { error: "no recovery key set" } };
		await this.commit({
			...this.state,
			schedule: { enabled, intervalHours, kind, lastStartedAt: this.state.schedule?.lastStartedAt ?? null },
		});
		return this.publicResult();
	};

	// Stamped at start, not completion, so a failing backup retries on the next
	// interval rather than in a tight loop.
	sweepSchedule = async () => {
		const { schedule, enrollment, recoveryKey } = this.state;
		if (!schedule?.enabled || !enrollment || !recoveryKey) return;
		const { running, restoring } = this.backups.status();
		if (running || restoring) return;
		const last = schedule.lastStartedAt ? Date.parse(schedule.lastStartedAt) : 0;
		if (Date.now() - last < schedule.intervalHours * 3_600_000) return;

		await this.commit({ ...this.state, schedule: { ...schedule, lastStartedAt: new Date().toISOString() } });
		this.log.info({ kind: schedule.kind }, "Scheduled Connect backup starting");
		this.backups.start({ enrollment, recoveryKeyHex: recoveryKey, kind: schedule.kind });
	};
}
