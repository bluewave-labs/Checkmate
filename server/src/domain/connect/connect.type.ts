export const CONNECT_STATE_COLLECTION = "connect_state";

export type ConnectBackupKind = "full" | "config";

export type ConnectEnrollment = {
	connectUrl: string;
	agentId: string;
	token: string;
	apiUrl: string | null;
};

export type ConnectBackupSchedule = {
	enabled: boolean;
	intervalHours: number;
	kind: ConnectBackupKind;
};

export type ConnectBackupResult = Record<string, unknown> & { ok: boolean; at: string };

export type ConnectState = {
	enrollment: ConnectEnrollment | null;
	remoteAccessEnabled: boolean;
	recoveryKey: string | null;
	schedule: ConnectBackupSchedule | null;
};

export const emptyConnectState = (): ConnectState => ({
	enrollment: null,
	remoteAccessEnabled: false,
	recoveryKey: null,
	schedule: null,
});
