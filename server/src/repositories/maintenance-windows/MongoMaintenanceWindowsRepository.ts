import type { MaintenanceWindow } from "@/types/index.js";
import { type MaintenanceWindowDocument, MaintenanceWindowModel } from "@/db/models/index.js";
import { IMaintenanceWindowsRepository } from "./IMaintenanceWindowsRepository.js";
import mongoose, { SortOrder } from "mongoose";
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

	private groupKey = (maintenanceWindow: MaintenanceWindow): string => {
		return (
			maintenanceWindow.groupId ??
			[
				maintenanceWindow.teamId,
				maintenanceWindow.name,
				maintenanceWindow.start,
				maintenanceWindow.end,
				maintenanceWindow.duration,
				maintenanceWindow.durationUnit,
				maintenanceWindow.repeat,
			].join("|")
		);
	};

	private groupMaintenanceWindows = (maintenanceWindows: MaintenanceWindow[]): MaintenanceWindow[] => {
		const grouped = new Map<string, MaintenanceWindow>();

		for (const maintenanceWindow of maintenanceWindows) {
			const key = this.groupKey(maintenanceWindow);
			const existing = grouped.get(key);

			if (!existing) {
				grouped.set(key, { ...maintenanceWindow, monitors: [maintenanceWindow.monitorId] });
				continue;
			}

			existing.monitors = [...(existing.monitors ?? []), maintenanceWindow.monitorId];
		}

		return Array.from(grouped.values());
	};

	private relatedQuery = (maintenanceWindow: MaintenanceWindow): Record<string, unknown> => {
		if (maintenanceWindow.groupId) {
			return {
				groupId: maintenanceWindow.groupId,
				teamId: new mongoose.Types.ObjectId(maintenanceWindow.teamId),
			};
		}

		return {
			teamId: new mongoose.Types.ObjectId(maintenanceWindow.teamId),
			name: maintenanceWindow.name,
			duration: maintenanceWindow.duration,
			durationUnit: maintenanceWindow.durationUnit,
			repeat: maintenanceWindow.repeat,
			start: new Date(maintenanceWindow.start),
			end: new Date(maintenanceWindow.end),
		};
	};

	private toEntity = (doc: MaintenanceWindowDocument): MaintenanceWindow => {
		return {
			id: this.toStringId(doc._id),
			groupId: doc.groupId,
			monitorId: this.toStringId(doc.monitorId),
			teamId: this.toStringId(doc.teamId),
			active: doc.active,
			name: doc.name,
			duration: doc.duration,
			durationUnit: doc.durationUnit,
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

	findRelated = async (maintenanceWindow: MaintenanceWindow): Promise<MaintenanceWindow[]> => {
		const maintenanceWindows = await MaintenanceWindowModel.find(this.relatedQuery(maintenanceWindow));
		return this.mapDocuments(maintenanceWindows);
	};

	findByMonitorId = async (monitorId: string, teamId: string): Promise<MaintenanceWindow[]> => {
		const maintenanceWindows = await MaintenanceWindowModel.find({
			monitorId: monitorId,
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

		// Sorting
		const sort: Record<string, SortOrder> = {};
		if (field !== undefined && order !== undefined) {
			sort[field] = order === "asc" ? 1 : -1;
		}

		const maintenanceWindows = await MaintenanceWindowModel.find(maintenanceQuery).sort(sort);
		const groupedMaintenanceWindows = this.groupMaintenanceWindows(this.mapDocuments(maintenanceWindows));

		const skip = page * rowsPerPage;
		return groupedMaintenanceWindows.slice(skip, skip + rowsPerPage);
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

		const maintenanceWindows = await MaintenanceWindowModel.find(maintenanceQuery);
		return this.groupMaintenanceWindows(this.mapDocuments(maintenanceWindows)).length;
	};
}

export default MongoMaintenanceWindowsRepository;
