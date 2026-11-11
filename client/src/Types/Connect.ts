export type ConnectBackupKind = "full" | "config";
export type ConnectOperation = "backup";
export type ConnectOperationState = "queued" | "running";
export type ConnectProgressStage = "dumping" | "uploading" | "saving";
export type ConnectBackupToolName = "mongodump" | "mongorestore";

export interface ConnectTunnelStatus {
	connected: boolean;
	lastConnectedAt: string | null;
	lastError: string | null;
	closeCode: number | null;
}

export interface ConnectStatus {
	enrolled: boolean;
	agentId: string | null;
	connectUrl: string | null;
	apiUrl: string | null;
	agentVersion: string;
	remoteAccess: { enabled: boolean };
	tunnel: ConnectTunnelStatus;
	backup: { recoveryKeySet: boolean };
}

export interface ConnectEnrollBody {
	connectUrl: string;
	agentId: string;
	token: string;
	apiUrl?: string;
}

export interface ConnectRemoteAccessBody {
	enabled: boolean;
}

export interface ConnectBackupResult {
	ok: boolean;
	at: string;
	kind: ConnectBackupKind;
	sizeBytes: number | null;
	sha256: string | null;
	backupId: string | null;
	durationMs: number | null;
	error: string | null;
}

export interface ConnectProgress {
	operation: ConnectOperation;
	stage: ConnectProgressStage;
	percent: number | null;
	bytes: number | null;
}

export interface ConnectOperationStatus {
	type: ConnectOperation;
	state: ConnectOperationState;
	requestedAt: string;
}

export interface ConnectBackupStatus {
	operation: ConnectOperationStatus | null;
	progress: ConnectProgress | null;
	lastBackup: ConnectBackupResult | null;
	missingTools: ConnectBackupToolName[];
}

export interface ConnectBackupListEntry {
	id: string;
	kind: string;
	sizeBytes: number;
	status: string;
	createdAt: string;
	keyId: string | null;
	expiresAt: string | null;
	restorable: boolean;
}

export interface ConnectBackupList {
	backups: ConnectBackupListEntry[];
}

export interface ConnectRecoveryKey {
	recoveryKey: string;
	format: string;
}

export interface ConnectQueued {
	queued: true;
}

export interface ConnectGenerateKeyBody {
	discardExisting: boolean;
}

export interface ConnectRunBackupBody {
	kind: ConnectBackupKind;
}
