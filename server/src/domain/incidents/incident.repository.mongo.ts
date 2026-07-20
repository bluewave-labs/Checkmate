import { IncidentModel } from "@/domain/incidents/incident.model.js";
import type { IncidentDocument } from "@/domain/incidents/incident.model.js";
import type { Incident, IncidentSummary } from "@/domain/incidents/incident.type.js";
import type { IIncidentsRepository } from "@/domain/incidents/incident.repository.interface.js";
import mongoose from "mongoose";
import { AppError } from "@/utils/AppError.js";
import { toStringId, toDateString } from "@/utils/mongoMappers.js";

class MongoIncidentsRepository implements IIncidentsRepository {
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

	private toEntity = (doc: IncidentDocument): Incident => {
		return {
			id: toStringId(doc._id),
			monitorId: toStringId(doc.monitorId),
			teamId: toStringId(doc.teamId),
			startTime: toDateString(doc.startTime),
			endTime: doc.endTime ? toDateString(doc.endTime) : null,
			status: doc.status,
			message: doc.message ?? null,
			statusCode: doc.statusCode ?? null,
			resolutionType: doc.resolutionType ?? null,
			resolvedBy: doc.resolvedBy ? toStringId(doc.resolvedBy) : null,
			resolvedByEmail: doc.resolvedByEmail ?? null,
			comment: doc.comment ?? null,
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	private mapDocuments = (documents: IncidentDocument[]): Incident[] => {
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
						monitorId: toStringId(monitorResult[0].monitorId),
						monitorName: monitorResult[0].monitorName ?? null,
						incidentCount: monitorResult[0].count,
					}
				: null,
			latestIncidents: latestIncidents.map((incident) => ({
				id: toStringId(incident._id),
				monitorId: toStringId(incident.monitorId),
				monitorName: incident.monitorName ?? null,
				status: incident.status,
				startTime: toDateString(incident.startTime),
				endTime: incident.endTime ? toDateString(incident.endTime) : null,
				resolutionType: incident.resolutionType ?? null,
				message: incident.message ?? null,
				statusCode: incident.statusCode ?? null,
				createdAt: toDateString(incident.createdAt),
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
}
export default MongoIncidentsRepository;
