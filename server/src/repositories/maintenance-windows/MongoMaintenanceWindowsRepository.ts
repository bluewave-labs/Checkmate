import type { MaintenanceWindow } from "@/types/index.js";
import { type MaintenanceWindowDocument, MaintenanceWindowModel } from "@/db/models/index.js";
import { IMaintenanceWindowsRepository } from "./IMaintenanceWindowsRepository.js";
import mongoose from "mongoose";
import { AppError } from "@/utils/AppError.js";

class MongoMaintenanceWindowsRepository implements IMaintenanceWindowsRepository {
	private toStringId = (value?: mongoose.Types.ObjectId | string | null): string => {
		if (!value) {
			return "";
		}
		return value instanceof mongoose.Types.ObjectId ? value.toString() : String(value);
	};

	private toDateString = (value?: Date | string | null): string => {
		if (!value) {
			return new Date(0).toISOString();
		}
		return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
	};

	private mapDocuments = (documents: MaintenanceWindowDocument[]): MaintenanceWindow[] => {
		if (!documents?.length) {
			return [];
		}
		return documents.map((doc) => this.toEntity(doc));
	};

	private toEntity = (doc: MaintenanceWindowDocument): MaintenanceWindow => {
		return {
			id: this.toStringId(doc._id),
			monitorId: this.toStringId(doc.monitorId),
			teamId: this.toStringId(doc.teamId),
			active: doc.active,
			name: doc.name,
			repeat: doc.repeat,
			start: this.toDateString(doc.start),
			end: this.toDateString(doc.end),
			createdAt: this.toDateString(doc.createdAt),
			updatedAt: this.toDateString(doc.updatedAt),
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

	findByTeamId = async (
		teamId: string,
		active: boolean,
		page: number,
		rowsPerPage: number,
		field: string,
		order: string
	): Promise<MaintenanceWindow[]> => {
		const maintenanceQuery: Record<string, any> = { teamId };

		if (active !== undefined) maintenanceQuery.active = active;

		// Pagination
		let skip = 0;
		if (page && rowsPerPage) {
			skip = page * rowsPerPage;
		}

		// Sorting
		let sort: Record<string, any> = {};
		if (field !== undefined && order !== undefined) {
			sort[field] = order === "asc" ? 1 : -1;
		}

		const maintenanceWindows = await MaintenanceWindowModel.find(maintenanceQuery).skip(skip).limit(rowsPerPage).sort(sort);
		return this.mapDocuments(maintenanceWindows);
	};

	countByTeamId = async (teamId: string, active: boolean) => {
		const maintenanceQuery: Record<string, any> = { teamId };

		if (active !== undefined) maintenanceQuery.active = active;

		return await MaintenanceWindowModel.countDocuments(maintenanceQuery);
	};
}

export default MongoMaintenanceWindowsRepository;
