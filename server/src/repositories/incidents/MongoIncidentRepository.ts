import { IncidentModel } from "@/db/models/index.js";
import type { IncidentDocument } from "@/db/models/Incident.js";
import type { Incident, IncidentSummary } from "@/types/index.js";
import type { IIncidentsRepository } from "@/repositories/index.js";
import mongoose from "mongoose";
import { AppError } from "@/utils/AppError.js";

class MongoIncidentRepository implements IIncidentsRepository {
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

	private buildMatchStage({
		teamId,
		startDate,
		status,
		monitorId,
		resolutionType,
	}: {
		teamId: string;
		startDate: Date | undefined;
		status?: boolean;
		monitorId?: string;
		resolutionType?: string;
	}): Record<string, unknown> {
		const matchStage: Record<string, unknown> = {
			teamId: new mongoose.Types.ObjectId(teamId),
			...(status !== undefined && { status }),
			...(monitorId && { monitorId: new mongoose.Types.ObjectId(monitorId) }),
			...(resolutionType && { resolutionType }),
		};

		if (startDate) {
			matchStage.createdAt = { $gte: startDate };
		}
		return matchStage;
	}

	protected toEntity = (doc: IncidentDocument): Incident => {
		return {
			id: this.toStringId(doc._id),
			monitorId: this.toStringId(doc.monitorId),
			teamId: this.toStringId(doc.teamId),
			startTime: this.toDateString(doc.startTime),
			endTime: doc.endTime ? this.toDateString(doc.endTime) : null,
			status: doc.status,
			message: doc.message ?? null,
			statusCode: doc.statusCode ?? null,
			resolutionType: doc.resolutionType ?? null,
			resolvedBy: doc.resolvedBy ? this.toStringId(doc.resolvedBy) : null,
			resolvedByEmail: doc.resolvedByEmail ?? null,
			comment: doc.comment ?? null,
			createdAt: this.toDateString(doc.createdAt),
			updatedAt: this.toDateString(doc.updatedAt),
		};
	};

	protected mapDocuments = (documents: IncidentDocument[] | IncidentDocument | null): Incident[] => {
		if (!documents) {
			return [];
		}
		if (Array.isArray(documents)) {
			return documents.map((doc) => this.toEntity(doc));
		}
		return [this.toEntity(documents)];
	};

	async create(incident: Partial<Incident>): Promise<Incident> {
		const newIncident = await IncidentModel.create(incident);
		return this.toEntity(newIncident);
	}

	findById = async (incidentId: string, teamId: string): Promise<Incident> => {
		const incident = await IncidentModel.findOne({
			_id: new mongoose.Types.ObjectId(incidentId),
			teamId: new mongoose.Types.ObjectId(teamId),
		});
		if (!incident) {
			throw new AppError({ message: `Incident with id ${incidentId} not found`, status: 404 });
		}
		return this.toEntity(incident);
	};

	findActiveByIncidentId = async (incidentId: string, teamId: string): Promise<Incident | null> => {
		const incident = await IncidentModel.findOne({
			_id: new mongoose.Types.ObjectId(incidentId),
			teamId: new mongoose.Types.ObjectId(teamId),
			status: true,
		});
		if (!incident) {
			return null;
		}
		return this.toEntity(incident);
	};

	findActiveByMonitorId = async (monitorId: string, teamId: string): Promise<Incident | null> => {
		const incident = await IncidentModel.findOne({
			monitorId: new mongoose.Types.ObjectId(monitorId),
			teamId: new mongoose.Types.ObjectId(teamId),
			status: true,
		});
		if (!incident) {
			return null;
		}
		return this.toEntity(incident);
	};

	findByTeamId = async (
		teamId: string,
		startDate: Date | undefined,
		page: number,
		rowsPerPage: number,
		sortOrder?: string,
		status?: boolean,
		monitorId?: string,
		resolutionType?: string
	): Promise<Incident[]> => {
		const matchStage = this.buildMatchStage({ teamId, startDate, status, monitorId, resolutionType });
		const incidents = await IncidentModel.find(matchStage)
			.sort({ createdAt: sortOrder === "asc" ? 1 : -1 })
			.skip(page * rowsPerPage)
			.limit(rowsPerPage);
		return this.mapDocuments(incidents);
	};

	updateById = async (incidentId: string, teamId: string, patch: Partial<Incident>) => {
		const updatedIncident = await IncidentModel.findOneAndUpdate(
			{ _id: new mongoose.Types.ObjectId(incidentId), teamId: new mongoose.Types.ObjectId(teamId) },
			{
				$set: {
					...patch,
				},
			},
			{ new: true, runValidators: true }
		);
		if (!updatedIncident) {
			throw new AppError({ message: `Failed to update incident with id ${incidentId}`, status: 500 });
		}
		return this.toEntity(updatedIncident);
	};

	countByTeamId = async (
		teamId: string,
		startDate: Date | undefined,
		status?: boolean,
		monitorId?: string,
		resolutionType?: string
	): Promise<number> => {
		const matchStage = this.buildMatchStage({ teamId, startDate, status, monitorId, resolutionType });
		return IncidentModel.countDocuments(matchStage);
	};

	findSummaryByTeamId = async (teamId: string, limit: number): Promise<IncidentSummary> => {
		const matchStage = { teamId: new mongoose.Types.ObjectId(teamId) };

		const counts = await IncidentModel.aggregate([
			{ $match: matchStage },
			{
				$group: {
					_id: "$status",
					count: { $sum: 1 },
					manualResolutions: {
						$sum: { $cond: [{ $eq: ["$resolutionType", "manual"] }, 1, 0] },
					},
					automaticResolutions: {
						$sum: { $cond: [{ $eq: ["$resolutionType", "automatic"] }, 1, 0] },
					},
				},
			},
		]);

		let total = 0;
		let active = 0;
		let manual = 0;
		let automatic = 0;

		counts.forEach((item) => {
			total += item.count;
			if (item._id === true) {
				active = item.count;
			}
			manual += item.manualResolutions;
			automatic += item.automaticResolutions;
		});

		const resolutionTimeResult = await IncidentModel.aggregate([
			{ $match: { ...matchStage, status: false, endTime: { $exists: true, $ne: null } } },
			{ $project: { resolutionTime: { $subtract: ["$endTime", "$startTime"] } } },
			{ $group: { _id: null, avgResolutionTime: { $avg: "$resolutionTime" } } },
		]);
		const avgResolutionTimeMs = resolutionTimeResult[0]?.avgResolutionTime || 0;
		const avgResolutionTimeHours = Math.round((avgResolutionTimeMs / (1000 * 60 * 60) || 0) * 100) / 100;

		const monitorResult = await IncidentModel.aggregate([
			{ $match: matchStage },
			{ $group: { _id: "$monitorId", count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
			{ $limit: 1 },
			{
				$lookup: {
					from: "monitors",
					localField: "_id",
					foreignField: "_id",
					as: "monitor",
				},
			},
			{ $project: { monitorId: "$_id", count: 1, monitorName: { $arrayElemAt: ["$monitor.name", 0] } } },
		]);

		const latestLimit = Math.max(1, Number.isFinite(Number(limit)) ? Number(limit) : 10);
		const latestIncidents = await IncidentModel.aggregate([
			{ $match: matchStage },
			{ $sort: { createdAt: -1 } },
			{ $limit: latestLimit },
			{
				$lookup: {
					from: "monitors",
					localField: "monitorId",
					foreignField: "_id",
					as: "monitor",
				},
			},
			{
				$project: {
					_id: 1,
					monitorId: 1,
					monitorName: { $arrayElemAt: ["$monitor.name", 0] },
					status: 1,
					startTime: 1,
					endTime: 1,
					resolutionType: 1,
					message: 1,
					statusCode: 1,
					createdAt: 1,
				},
			},
		]);

		return {
			total,
			totalActive: active,
			totalManualResolutions: manual,
			totalAutomaticResolutions: automatic,
			avgResolutionTimeHours,
			topMonitor: monitorResult[0]
				? {
						monitorId: this.toStringId(monitorResult[0].monitorId),
						monitorName: monitorResult[0].monitorName ?? null,
						incidentCount: monitorResult[0].count,
					}
				: null,
			latestIncidents: latestIncidents.map((incident) => ({
				id: this.toStringId(incident._id),
				monitorId: this.toStringId(incident.monitorId),
				monitorName: incident.monitorName ?? null,
				status: incident.status,
				startTime: this.toDateString(incident.startTime),
				endTime: incident.endTime ? this.toDateString(incident.endTime) : null,
				resolutionType: incident.resolutionType ?? null,
				message: incident.message ?? null,
				statusCode: incident.statusCode ?? null,
				createdAt: this.toDateString(incident.createdAt),
			})),
		};
	};

	deleteByMonitorId = async (monitorId: string, teamId: string) => {
		const result = await IncidentModel.deleteMany({
			monitorId: new mongoose.Types.ObjectId(monitorId),
			teamId: new mongoose.Types.ObjectId(teamId),
		});
		return result.deletedCount || 0;
	};

	deleteByMonitorIdsNotIn = async (monitorIds: string[]): Promise<number> => {
		const objectIds = monitorIds.map((id) => new mongoose.Types.ObjectId(id));
		const result = await IncidentModel.deleteMany({ monitorId: { $nin: objectIds } });
		return result.deletedCount ?? 0;
	};

	addEscalationSent = async (incidentId: string, escalationLevel: number): Promise<void> => {
		await IncidentModel.updateOne(
			{ _id: new mongoose.Types.ObjectId(incidentId) },
			{
				$addToSet: {
					escalationsSent: escalationLevel,
				},
			}
		);
	};
}
export default MongoIncidentRepository;
