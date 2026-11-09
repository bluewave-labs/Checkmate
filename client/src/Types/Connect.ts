export interface ConnectStatus {
	enrolled: boolean;
	agentId: string | null;
	connectUrl: string | null;
	apiUrl: string | null;
	agentVersion: string;
}

export interface ConnectEnrollBody {
	connectUrl: string;
	agentId: string;
	token: string;
	apiUrl?: string;
}
