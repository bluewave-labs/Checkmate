import type { ICheckRollupsRepository } from "@/domain/check-rollups/check-rollup.repository.interface.js";
import type { IChecksRepository } from "@/domain/checks/check.repository.interface.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { CHECK_TTL_SENTINEL } from "@/domain/checks/check.type.js";
import {
	ROLLUP_BUCKET_MINUTES,
	ROLLUP_CHUNK_HOURS,
	ROLLUP_REROLL_HOURS,
	ROLLUP_RETENTION_MARGIN_HOURS,
} from "@/domain/check-rollups/check-rollup.type.js";

const SERVICE_NAME = "CheckRollupService";
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const BUCKET_MS = ROLLUP_BUCKET_MINUTES * 60 * 1000;
const CHUNK_MS = ROLLUP_CHUNK_HOURS * MS_PER_HOUR;
const REROLL_MS = ROLLUP_REROLL_HOURS * MS_PER_HOUR; // Roll ups overlap by 2h to account for late checks
const RETENTION_MARGIN_MS = ROLLUP_RETENTION_MARGIN_HOURS * MS_PER_HOUR;

const floorToBucket = (ms: number): number => Math.floor(ms / BUCKET_MS) * BUCKET_MS;
const ceilToBucket = (ms: number): number => Math.ceil(ms / BUCKET_MS) * BUCKET_MS;

export interface ICheckRollupService {
	rollUpClosedBuckets(): Promise<void>;
}

export class CheckRollupService implements ICheckRollupService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(
		private checkRollupsRepository: ICheckRollupsRepository,
		private checksRepository: IChecksRepository,
		private settingsService: ISettingsService
	) {}

	private findUnclampedStart = async (): Promise<number | null> => {
		const latest = await this.checkRollupsRepository.findLatestBucketStart();
		// If we already have rollups, find the latest bucket, go back REROLL_MS.
		// This ensures we roll up old data again in case late checks arrive
		if (latest) return latest.getTime() - REROLL_MS;

		// Otherwise, this is the first rollup find the oldest check and start from there
		// If there aren't any checks at all, return null, nothing to do
		const oldest = await this.checksRepository.findOldestCreatedAt();
		if (!oldest) return null;
		return floorToBucket(oldest.getTime());
	};

	private findWindowStart = async (now: number): Promise<number | null> => {
		const start = await this.findUnclampedStart();
		if (start === null) return null;

		// A start date was returned.  If it's older than our check TTL value, we clamp there
		// margin is added to check TTL so we don't rollup checks meant to expire
		const { checkTTL } = await this.settingsService.getDBSettings();
		if (checkTTL === CHECK_TTL_SENTINEL) return start;
		const retentionFloor = ceilToBucket(now - checkTTL * MS_PER_DAY + RETENTION_MARGIN_MS);

		return Math.max(start, retentionFloor);
	};

	rollUpClosedBuckets = async (): Promise<void> => {
		const now = Date.now();
		const to = floorToBucket(now);
		const from = await this.findWindowStart(now);
		if (from === null || from >= to) return;

		for (let chunkStart = from; chunkStart < to; chunkStart += CHUNK_MS) {
			const chunkEnd = Math.min(chunkStart + CHUNK_MS, to);
			await this.checkRollupsRepository.rollUp(new Date(chunkStart), new Date(chunkEnd));
		}
	};
}
