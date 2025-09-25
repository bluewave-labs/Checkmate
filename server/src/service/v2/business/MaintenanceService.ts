import { ITokenizedUser, IMaintenance, Maintenance } from "../../../db/v2/models/index.js";
import ApiError from "../../../utils/ApiError.js";

const SERVICE_NAME = "MaintenanceServiceV2";

export interface IMaintenanceService {
	create: (
		tokenizedUser: ITokenizedUser,

		maintenance: IMaintenance
	) => Promise<IMaintenance>;
	getAll: () => Promise<IMaintenance[]>;
	get: (id: string) => Promise<IMaintenance>;
	toggleActive: (tokenizedUser: ITokenizedUser, id: string) => Promise<IMaintenance>;
	update: (tokenizedUser: ITokenizedUser, id: string, updateData: Partial<IMaintenance>) => Promise<IMaintenance>;
	delete: (id: string) => Promise<boolean>;
	isInMaintenance: (monitorId: string) => Promise<boolean>;
}

type MaintenanceCache = Map<string, IMaintenance[]>;

class MaintenanceService implements IMaintenanceService {
	static SERVICE_NAME = SERVICE_NAME;
	private maintenanceCache: MaintenanceCache;
	private lastRefresh: number;
	private CACHE_TTL_MS = 60 * 1000;

	constructor() {
		this.maintenanceCache = new Map();
		this.lastRefresh = 0;
	}

	create = async (tokenizedUser: ITokenizedUser, maintenanceData: IMaintenance) => {
		const maintenance = await Maintenance.create({
			...maintenanceData,
			createdBy: tokenizedUser.sub,
			updatedBy: tokenizedUser.sub,
		});
		return maintenance;
	};

	get = async (id: string) => {
		const maintenance = await Maintenance.findById(id);
		if (!maintenance) {
			throw new ApiError("Maintenance not found", 404);
		}
		return maintenance;
	};

	getAll = async () => {
		return Maintenance.find();
	};

	toggleActive = async (tokenizedUser: ITokenizedUser, id: string) => {
		const updatedMaintenance = await Maintenance.findOneAndUpdate(
			{ _id: id },
			[
				{
					$set: {
						isActive: { $not: "$isActive" },
						updatedBy: tokenizedUser.sub,
						updatedAt: new Date(),
					},
				},
			],
			{ new: true }
		);
		if (!updatedMaintenance) {
			throw new ApiError("Maintenance not found", 404);
		}
		return updatedMaintenance;
	};

	update = async (tokenizedUser: ITokenizedUser, id: string, updateData: Partial<IMaintenance>) => {
		const allowedFields: (keyof IMaintenance)[] = ["name", "monitors", "startTime", "endTime", "isActive"];
		const safeUpdate: Partial<IMaintenance> = {};
		for (const field of allowedFields) {
			if (updateData[field] !== undefined) {
				(safeUpdate as any)[field] = updateData[field];
			}
		}

		const updatedMaintenance = await Maintenance.findByIdAndUpdate(
			id,
			{
				$set: {
					...safeUpdate,
					updatedAt: new Date(),
					updatedBy: tokenizedUser.sub,
				},
			},
			{ new: true, runValidators: true }
		);

		if (!updatedMaintenance) {
			throw new ApiError("Failed to update maintenance", 500);
		}

		return updatedMaintenance;
	};

	delete = async (id: string) => {
		const result = await Maintenance.deleteOne({ _id: id });
		if (!result.deletedCount) {
			throw new ApiError("Maintenance not found", 404);
		}
		return result.deletedCount === 1;
	};

	private refreshCache = async () => {
		const now = new Date();

		const activeMaintenances = await Maintenance.find({
			isActive: true,
			startTime: { $lte: now },
			endTime: { $gte: now },
		}).lean();

		// Reset cache
		const newCache = new Map();

		for (const m of activeMaintenances) {
			for (const monitorId of m.monitors) {
				const key = monitorId.toString();
				if (!newCache.has(key)) newCache.set(key, []);
				newCache.get(key)!.push(m);
			}
		}

		this.maintenanceCache = newCache;
		this.lastRefresh = Date.now();
	};

	isInMaintenance = async (monitorId: string) => {
		const now = Date.now();
		if (now - this.lastRefresh > this.CACHE_TTL_MS) {
			await this.refreshCache();
		}
		const maintenances = this.maintenanceCache.get(monitorId) || [];
		return maintenances.length > 0;
	};
}

export default MaintenanceService;
