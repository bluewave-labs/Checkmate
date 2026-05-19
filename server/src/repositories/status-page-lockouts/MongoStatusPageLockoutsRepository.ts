import mongoose from "mongoose";
import StatusPageLockoutModel from "@/db/models/StatusPageLockout.js";
import type { IStatusPageLockoutsRepository, StatusPageLockoutState } from "./IStatusPageLockoutsRepository.js";

class MongoStatusPageLockoutsRepository implements IStatusPageLockoutsRepository {
	recordFailure = async (statusPageId: string, ipHash: string, windowMs: number): Promise<StatusPageLockoutState> => {
		const now = new Date();
		const pageId = new mongoose.Types.ObjectId(statusPageId);

		// Within the current window: increment attempts; do NOT push expiresAt out.
		// This bounds the lockout to one window per (page, ip) so an attacker can't
		// accumulate attempts across hours of slow guessing, and a legitimate user
		// who fails N times in a window doesn't see those attempts persist forever.
		const updated = await StatusPageLockoutModel.findOneAndUpdate(
			{ statusPageId: pageId, ipHash, expiresAt: { $gt: now } },
			{ $inc: { attempts: 1 } },
			{ new: true }
		);
		if (updated) {
			return { attempts: updated.attempts, lockedUntil: updated.expiresAt };
		}

		// Either no doc exists or the previous window expired — start a fresh window.
		const fresh = await StatusPageLockoutModel.findOneAndUpdate(
			{ statusPageId: pageId, ipHash },
			{ $set: { attempts: 1, expiresAt: new Date(now.getTime() + windowMs) } },
			{ upsert: true, new: true }
		);
		return { attempts: fresh.attempts, lockedUntil: fresh.expiresAt };
	};

	getState = async (statusPageId: string, ipHash: string): Promise<StatusPageLockoutState> => {
		const doc = await StatusPageLockoutModel.findOne({
			statusPageId: new mongoose.Types.ObjectId(statusPageId),
			ipHash,
		});
		if (!doc) {
			return { attempts: 0, lockedUntil: null };
		}
		return { attempts: doc.attempts, lockedUntil: doc.expiresAt };
	};

	clear = async (statusPageId: string, ipHash: string): Promise<void> => {
		await StatusPageLockoutModel.deleteOne({
			statusPageId: new mongoose.Types.ObjectId(statusPageId),
			ipHash,
		});
	};
}

export default MongoStatusPageLockoutsRepository;
