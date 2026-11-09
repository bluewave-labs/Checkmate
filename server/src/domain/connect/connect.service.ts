import crypto from "node:crypto";
import type { Mongoose } from "mongoose";
import type { IDb } from "@/db/db.interface.js";
import type { IEncryptionService } from "@/service/encryption/encryptionService.js";
import type { ILogger } from "@/utils/logger/logger.js";
import type { IJobScheduler } from "@/worker/worker.interface.js";
import { ConnectBackup, recoveryKeyId, type RecoveryKeyCheck } from "@/domain/connect/connect.backup.js";
import { ConnectHeartbeat } from "@/domain/connect/connect.heartbeat.js";
import type { IConnectRepository } from "@/domain/connect/connect.repository.js";
import { ENCRYPTED_PREFIX, revealConnectState } from "@/domain/connect/connect.secrets.js";
import { ConnectTunnel } from "@/domain/connect/connect.tunnel.js";
import { emptyConnectState, type ConnectBackupKind, type ConnectState } from "@/domain/connect/connect.type.js";

const SERVICE_NAME = "ConnectService";
const HOUR_MS = 3_600_000;
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
	scheduler: Pick<IJobScheduler, "setConnectBackupJob" | "removeConnectBackupJob" | "isConnectBackupRunning">;
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
	getBackupStatus(): Promise<ConnectResult>;
	listBackups(): Promise<ConnectResult>;
	createRecoveryKey(options?: { discardExisting?: boolean }): Promise<ConnectResult>;
	importRecoveryKey(recoveryKey: string, options?: { replaceExisting?: boolean }): Promise<ConnectResult>;
	runBackup(kind?: ConnectBackupKind): Promise<ConnectResult>;
	restoreBackup(backupId: string): Promise<ConnectResult>;
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
	private scheduler: ConnectDeps["scheduler"];
	private encryptionService: IEncryptionService;
	private db: IDb<Mongoose>;
	private options: ConnectOptions;
	private state: ConnectState = emptyConnectState();
	private tunnel: ConnectTunnel;
	private heartbeat: ConnectHeartbeat;
	private backups: ConnectBackup;
	// Until stored state has loaded, writing could overwrite the real enrollment
	// or recovery key, so changes are refused during startup and after a failed
	// load.
	private stateLoaded = false;
	private creatingRecoveryKey = false;

	constructor({ repository, scheduler, encryptionService, db, logger, options }: ConnectDeps) {
		this.log = logger.child({ service: SERVICE_NAME });
		this.repository = repository;
		this.scheduler = scheduler;
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
			// A full restore replaces the jobs collection.
			onRestored: () => void this.syncBackupJob(),
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
			this.stateLoaded = true;
			this.applyState();
			void this.backups.checkTools();
		} catch (error) {
			this.state = emptyConnectState();
			this.stateLoaded = false;
			this.log.error({ err: error }, "Connect could not load its state and stays inactive");
		}
	};

	private stateUnavailable = (): ConnectResult => ({
		status: 503,
		data: { error: "Connect state is not available. If this continues, check ENCRYPTION_KEY and the server logs." },
	});

	stop = () => {
		this.tunnel.stop();
		this.heartbeat.stop();
	};

	// ---- Secrets at rest ----
	// Encrypted whenever ENCRYPTION_KEY is configured, matching Checkmate's
	// other optional encrypted fields.

	private encryptSecret = (value: string) => (this.encryptionService.isConfigured() ? this.encryptionService.encrypt(value) : value);

	private protect = (state: ConnectState): ConnectState => ({
		...state,
		enrollment: state.enrollment ? { ...state.enrollment, token: this.encryptSecret(state.enrollment.token) } : null,
		recoveryKey: state.recoveryKey ? this.encryptSecret(state.recoveryKey) : null,
	});

	private reveal = (state: ConnectState) => revealConnectState(state, this.encryptionService);

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

		void this.syncBackupJob();
	};

	// Scheduled backups live in the jobs collection so that one node claims each
	// run. The tunnel and heartbeat stay here: they report on this node.
	private syncBackupJob = async () => {
		const { schedule, enrollment, recoveryKey } = this.state;
		try {
			if (schedule?.enabled && enrollment && recoveryKey) await this.scheduler.setConnectBackupJob(schedule.intervalHours * HOUR_MS);
			else await this.scheduler.removeConnectBackupJob();
		} catch (error: unknown) {
			this.log.error({ err: error }, "Could not update the Connect backup job");
		}
	};

	private scheduledBackupRunning = (): ConnectResult => ({ status: 409, data: { error: "A scheduled backup is running" } });

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
		if (!this.stateLoaded) return this.stateUnavailable();
		const { allowedHosts } = this.options;
		if (!isConnectHostAllowed(connectUrl, allowedHosts) || (apiUrl && !isConnectHostAllowed(apiUrl, allowedHosts))) {
			return { status: 400, data: { error: "connect host not allowed" } };
		}
		await this.commit({ ...this.state, enrollment: { connectUrl, agentId, token, apiUrl: apiUrl ?? null } });
		this.applyState();
		return this.publicResult();
	};

	setRemoteAccess = async (enabled: boolean): Promise<ConnectResult> => {
		if (!this.stateLoaded) return this.stateUnavailable();
		if (enabled && !this.state.enrollment) return { status: 409, data: { error: "not enrolled" } };
		await this.commit({ ...this.state, remoteAccessEnabled: enabled });
		this.applyState();
		return this.publicResult();
	};

	unenroll = async (): Promise<ConnectResult> => {
		if (!this.stateLoaded) return this.stateUnavailable();
		await this.commit({ ...this.state, enrollment: null, remoteAccessEnabled: false });
		this.applyState();
		return this.publicResult();
	};

	getBackupStatus = async (): Promise<ConnectResult> => {
		this.backups.recheckMissingTools();
		const [scheduledRunning, scheduled] = await Promise.all([this.scheduler.isConnectBackupRunning(), this.repository.loadLastScheduledBackup()]);
		const local = this.backups.status();
		const lastResult = !local.lastResult || (scheduled && scheduled.at > local.lastResult.at) ? scheduled : local.lastResult;
		return { status: 200, data: { ...local, lastResult, scheduledRunning } };
	};

	listBackups = async (): Promise<ConnectResult> => {
		if (!this.state.enrollment) return { status: 409, data: { error: "not enrolled" } };
		try {
			const data = await this.backups.list(this.state.enrollment);
			const keyId = this.state.recoveryKey ? recoveryKeyId(this.state.recoveryKey) : null;
			const backups = (data.backups as { keyId?: string | null }[] | undefined)?.map((backup) => ({
				...backup,
				restorable: !backup.keyId || backup.keyId === keyId,
			}));
			return { status: 200, data: { ...data, backups } };
		} catch (error) {
			return { status: 502, data: { error: error instanceof Error ? error.message : "control plane unreachable" } };
		}
	};

	// Generated once and returned once; without it the cloud copies cannot be
	// decrypted, so the caller must have the operator store it safely.
	//
	// Refused while cloud backups exist unless the operator accepts losing them:
	// the new key's first backup starts the 30 days after which the cloud deletes
	// them, and an operator who has the original key should import it.
	createRecoveryKey = async ({ discardExisting = false }: { discardExisting?: boolean } = {}): Promise<ConnectResult> => {
		if (!this.stateLoaded) return this.stateUnavailable();
		const { enrollment } = this.state;
		if (!enrollment) return { status: 409, data: { error: "not enrolled" } };
		if (this.state.recoveryKey || this.creatingRecoveryKey) {
			return { status: 409, data: { error: "recovery key already set" } };
		}
		this.creatingRecoveryKey = true;
		try {
			if (!discardExisting) {
				let stored: { backups?: unknown[] };
				try {
					stored = (await this.backups.list(enrollment)) as { backups?: unknown[] };
				} catch (error) {
					return { status: 502, data: { error: error instanceof Error ? error.message : "control plane unreachable" } };
				}
				if (stored.backups?.length) {
					return { status: 409, data: { error: "Cloud backups already exist. Enter the recovery key from your original server" } };
				}
			}
			const recoveryKey = crypto.randomBytes(32).toString("hex");
			await this.commit({ ...this.state, recoveryKey });
			return { status: 200, data: { recoveryKey, format: "CMKB1" } };
		} finally {
			this.creatingRecoveryKey = false;
		}
	};

	// For a replacement server, or an operator who said they lost the key and
	// then found it. The key is saved only after it decrypts a stored backup, so
	// a typo can never replace a working key.
	importRecoveryKey = async (recoveryKey: string, { replaceExisting = false }: { replaceExisting?: boolean } = {}): Promise<ConnectResult> => {
		if (!this.stateLoaded) return this.stateUnavailable();
		const { enrollment } = this.state;
		if (!enrollment) return { status: 409, data: { error: "not enrolled" } };
		if ((this.state.recoveryKey && !replaceExisting) || this.creatingRecoveryKey) {
			return { status: 409, data: { error: "recovery key already set" } };
		}
		if (this.state.recoveryKey?.toLowerCase() === recoveryKey.toLowerCase()) {
			return { status: 409, data: { error: "This is already your recovery key" } };
		}
		this.creatingRecoveryKey = true;
		try {
			let check: RecoveryKeyCheck;
			try {
				check = await this.backups.verifyRecoveryKey({ enrollment, recoveryKeyHex: recoveryKey });
			} catch (error) {
				return { status: 502, data: { error: error instanceof Error ? error.message : "control plane unreachable" } };
			}
			if (check === "wrong-key") return { status: 422, data: { error: "This key does not decrypt your cloud backups" } };
			if (check === "no-backups") return { status: 409, data: { error: "No cloud backups to check this key against" } };
			if (check === "busy") return { status: 409, data: { error: "A backup or restore is already running" } };
			await this.commit({ ...this.state, recoveryKey });
			return this.publicResult();
		} finally {
			this.creatingRecoveryKey = false;
		}
	};

	runBackup = async (kind: ConnectBackupKind = "full"): Promise<ConnectResult> => {
		if (!this.stateLoaded) return this.stateUnavailable();
		const { enrollment, recoveryKey } = this.state;
		if (!enrollment) return { status: 409, data: { error: "not enrolled" } };
		if (!recoveryKey) return { status: 409, data: { error: "no recovery key set" } };
		if (await this.scheduler.isConnectBackupRunning()) return this.scheduledBackupRunning();
		const result = this.backups.start({ enrollment, recoveryKeyHex: recoveryKey, kind });
		return { status: result.started ? 202 : 409, data: result };
	};

	// Destructive (mongorestore --drop); the UI confirms with the operator.
	restoreBackup = async (backupId: string): Promise<ConnectResult> => {
		if (!this.stateLoaded) return this.stateUnavailable();
		const { enrollment, recoveryKey } = this.state;
		if (!enrollment) return { status: 409, data: { error: "not enrolled" } };
		if (!recoveryKey) return { status: 409, data: { error: "restores need the original recovery key" } };
		if (await this.scheduler.isConnectBackupRunning()) return this.scheduledBackupRunning();
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
		if (!this.stateLoaded) return this.stateUnavailable();
		if (enabled && !this.state.recoveryKey) return { status: 409, data: { error: "no recovery key set" } };
		const previous = this.state.schedule;
		await this.commit({ ...this.state, schedule: { enabled, intervalHours, kind } });
		if (!enabled) {
			await this.scheduler.removeConnectBackupJob();
			return this.publicResult();
		}
		const intervalMs = intervalHours * HOUR_MS;
		// A row that already exists keeps its next run, so a new interval has to move it.
		const intervalChanged = previous?.enabled && previous.intervalHours !== intervalHours;
		await this.scheduler.setConnectBackupJob(intervalMs, intervalChanged ? Date.now() + intervalMs : undefined);
		return this.publicResult();
	};
}
