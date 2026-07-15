import type { MaintenanceWindow } from "@/domain/maintenance-windows/maintenance-window.type.js";
import { type MaintenanceWindowDocument, MaintenanceWindowModel } from "@/domain/maintenance-windows/maintenance-window.model.js";
import { IMaintenanceWindowsRepository } from "./maintenance-window.repository.interface.js";
import mongoose, { SortOrder } from "mongoose";
import { AppError } from "@/utils/AppError.js";
import { toStringId, toDateString } from "@/utils/mongoMappers.js";
class MongoMaintenanceWindowsRepository implements IMaintenanceWindowsRepository {
	private mapDocuments = (documents: MaintenanceWindowDocument[]): MaintenanceWindow[] => {
		if (!documents?.length) {
			return [];
		}
		return documents.map((doc) => this.toEntity(doc));
	};

	private toEntity = (doc: MaintenanceWindowDocument): MaintenanceWindow => {
		return {
			id: toStringId(doc._id),
			monitorIds: doc.monitorIds.map(toStringId),
			teamId: toStringId(doc.teamId),
			active: doc.active,
			name: doc.name,
			duration: doc.duration,
			durationUnit: doc.durationUnit,
			repeat: doc.repeat,
			start: toDateString(doc.start),
			end: toDateString(doc.end),
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	create = async (data: Partial<MaintenanceWindow>): Promise<MaintenanceWindow> => {
		const maintenanceWindow = new MaintenanceWindowModel(data);

		// If the maintenance window is a one time window, set the expiry to the end date
		if (maintenanceWindow.repeat === 0) {
			maintenanceWindow.expiry = maintenanceWindow.end;
		}
		const result = await maintenanceWindow.save();
		return this.toEntity(result);
	};

	findById = async (id: string, teamId: string): Promise<MaintenanceWindow> => {
		const maintenanceWindow = await MaintenanceWindowModel.findOne({
			_id: id,
			teamId: teamId,
		});
		if (!maintenanceWindow) {
			throw new AppError({ message: "Maintenance Window not found", status: 404 });
		}
		return this.toEntity(maintenanceWindow);
	};

	findByMonitorIds = async (monitorIds: string[], teamId: string, excludeId?: string): Promise<MaintenanceWindow[]> => {
		const query: Record<string, unknown> = {
			monitorIds: { $in: monitorIds },
			teamId,
		};
		if (excludeId) {
			query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
		}
		const maintenanceWindows = await MaintenanceWindowModel.find(query);
		return this.mapDocuments(maintenanceWindows);
	};

	findByMonitorId = async (monitorId: string, teamId: string): Promise<MaintenanceWindow[]> => {
		const maintenanceWindows = await MaintenanceWindowModel.find({
			monitorIds: monitorId,
			teamId: teamId,
		});
		return this.mapDocuments(maintenanceWindows);
	};

	findByTeamId = async (
		teamId: string,
		page: number,
		rowsPerPage: number,
		field?: string,
		order?: string,
		active?: boolean
	): Promise<MaintenanceWindow[]> => {
		const maintenanceQuery: Record<string, unknown> = { teamId };

		if (active !== undefined) maintenanceQuery.active = active;

		// Pagination
		let skip = 0;
		if (page && rowsPerPage) {
			skip = page * rowsPerPage;
		}

		// Sorting
		const sort: Record<string, SortOrder> = {};
		if (field !== undefined && order !== undefined) {
			sort[field] = order === "asc" ? 1 : -1;
		}

		const maintenanceWindows = await MaintenanceWindowModel.find(maintenanceQuery).skip(skip).limit(rowsPerPage).sort(sort);
		return this.mapDocuments(maintenanceWindows);
	};

	updateById = async (id: string, teamId: string, data: Partial<MaintenanceWindow>): Promise<MaintenanceWindow> => {
		const updated = await MaintenanceWindowModel.findOneAndUpdate(
			{
				_id: new mongoose.Types.ObjectId(id),
				teamId: new mongoose.Types.ObjectId(teamId),
			},
			{ $set: data },
			{ new: true, runValidators: true }
		);
		if (!updated) {
			throw new AppError({ message: "Maintenance window not found or could not be updated", status: 404 });
		}

		return this.toEntity(updated);
	};

	deleteById = async (id: string, teamId: string): Promise<MaintenanceWindow> => {
		const deleted = await MaintenanceWindowModel.findOneAndDelete({
			_id: new mongoose.Types.ObjectId(id),
			teamId: new mongoose.Types.ObjectId(teamId),
		});
		if (!deleted) {
			throw new AppError({ message: "Maintenance window not found or could not be deleted", status: 404 });
		}

		return this.toEntity(deleted);
	};
	countByTeamId = async (teamId: string, active?: boolean) => {
		const maintenanceQuery: Record<string, unknown> = { teamId };

		if (active !== undefined) maintenanceQuery.active = active;

		return await MaintenanceWindowModel.countDocuments(maintenanceQuery);
	};
}

export default MongoMaintenanceWindowsRepository;
