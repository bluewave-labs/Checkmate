export interface StatusPageLockoutState {
	attempts: number;
	lockedUntil: Date | null;
}

export interface IStatusPageLockoutsRepository {
	recordFailure(statusPageId: string, ipHash: string, windowMs: number): Promise<StatusPageLockoutState>;
	getState(statusPageId: string, ipHash: string): Promise<StatusPageLockoutState>;
	clear(statusPageId: string, ipHash: string): Promise<void>;
}
