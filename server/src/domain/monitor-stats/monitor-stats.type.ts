export interface CheckResultInput {
	status: boolean;
	responseTime: number;
	now: number;
}

export interface MonitorStats {
	id: string;
	monitorId: string;
	avgResponseTime: number;
	maxResponseTime: number;
	totalChecks: number;
	totalUpChecks: number;
	totalDownChecks: number;
	uptimePercentage: number;
	lastCheckTimestamp: number;
	lastResponseTime: number;
	timeOfLastFailure?: number;
	createdAt: string;
	updatedAt: string;
}
