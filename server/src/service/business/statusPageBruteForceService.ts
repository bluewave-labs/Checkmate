import crypto from "node:crypto";
import type { IStatusPageLockoutsRepository } from "@/repositories/status-page-lockouts/IStatusPageLockoutsRepository.js";

export const MAX_ATTEMPTS = 10;
export const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

export class StatusPageBruteForceService {
	constructor(private lockoutsRepository: IStatusPageLockoutsRepository) {}

	hashIp = (ip: string): string => {
		return crypto.createHash("sha256").update(ip).digest("hex");
	};

	isLockedOut = async (statusPageId: string, ipHash: string): Promise<boolean> => {
		const state = await this.lockoutsRepository.getState(statusPageId, ipHash);
		if (state.attempts < MAX_ATTEMPTS) return false;
		if (!state.lockedUntil) return false;
		return state.lockedUntil.getTime() > Date.now();
	};

	recordFailure = async (statusPageId: string, ipHash: string): Promise<void> => {
		await this.lockoutsRepository.recordFailure(statusPageId, ipHash, LOCKOUT_WINDOW_MS);
	};

	clear = async (statusPageId: string, ipHash: string): Promise<void> => {
		await this.lockoutsRepository.clear(statusPageId, ipHash);
	};
}
