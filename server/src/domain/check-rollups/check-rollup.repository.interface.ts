export interface ICheckRollupsRepository {
	// write
	rollUp(from: Date, to: Date): Promise<void>;
	// single fetch
	findLatestBucketStart(): Promise<Date | null>;
	// delete
	deleteByMonitorId(monitorId: string): Promise<number>;
	deleteByTeamId(teamId: string): Promise<number>;
	deleteByMonitorIdsNotIn(monitorIds: string[]): Promise<number>;
}
