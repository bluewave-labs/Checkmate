import { IncidentModel } from "@/db/models/index.js";
import type { IncidentDocument } from "@/db/models/Incident.js";
import type { Incident } from "@/types/index.js";
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

	findByTeamId = async (teamId: string): Promise<Incident[]> => {
		throw new Error("Method not implemented.");
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
}
export default MongoIncidentRepository;
