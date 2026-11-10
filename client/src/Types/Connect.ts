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
