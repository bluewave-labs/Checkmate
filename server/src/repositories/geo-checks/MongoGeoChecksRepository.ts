import { IGeoChecksRepository } from "./IGeoChecksRepository.js";
import type { GeoCheck, GeoCheckMetadata, GeoCheckResult, GroupedGeoCheck, GeoContinent } from "@/types/geoCheck.js";
import type { GeoChecksQueryResult } from "./IGeoChecksRepository.js";
import { GeoCheckModel, type GeoCheckDocument } from "@/db/models/index.js";
import mongoose from "mongoose";

const SERVICE_NAME = "GeoChecksRepository";

const dateRangeLookup: Record<string, Date> = {
	recent: new Date(Date.now() - 60 * 60 * 1000),
	day: new Date(Date.now() - 24 * 60 * 60 * 1000),
	week: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
	month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
};

class MongoGeoChecksRepository implements IGeoChecksRepository {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: any;
	constructor(logger: any) {
		this.logger = logger;
	}

	private toEntity = (doc: GeoCheckDocument): GeoCheck => {
		const toStringId = (value: mongoose.Types.ObjectId | string | undefined | null): string => {
			if (!value) {
				return "";
			}
			return value instanceof mongoose.Types.ObjectId ? value.toString() : String(value);
		};

		const toDateString = (value?: Date | string | null): string => {
			if (!value) {
				return new Date(0).toISOString();
			}
			return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
		};

		const mapMetadata = (metadata: any): GeoCheckMetadata => ({
			monitorId: toStringId(metadata.monitorId),
			teamId: toStringId(metadata.teamId),
			type: metadata.type,
		});

		const mapResults = (results: any[]): GeoCheckResult[] => {
			if (!results || !Array.isArray(results)) {
				return [];
			}
			return results.map((result) => ({
				location: {
					continent: result.location?.continent ?? "",
					region: result.location?.region ?? "",
					country: result.location?.country ?? "",
					state: result.location?.state ?? "",
					city: result.location?.city ?? "",
					longitude: result.location?.longitude ?? 0,
					latitude: result.location?.latitude ?? 0,
				},
				status: result.status ?? false,
				statusCode: result.statusCode ?? 0,
				timings: {
					total: result.timings?.total ?? 0,
					dns: result.timings?.dns ?? 0,
					tcp: result.timings?.tcp ?? 0,
					tls: result.timings?.tls ?? 0,
					firstByte: result.timings?.firstByte ?? 0,
					download: result.timings?.download ?? 0,
				},
			}));
		};

		return {
			id: toStringId(doc._id),
			metadata: mapMetadata(doc.metadata),
			results: mapResults(doc.results),
			expiry: toDateString(doc.expiry),
			__v: doc.__v ?? 0,
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	createGeoChecks = async (geoChecks: Omit<GeoCheck, "id" | "__v" | "createdAt" | "updatedAt">[]): Promise<GeoCheck[]> => {
		try {
			const docs = await GeoCheckModel.insertMany(
				geoChecks.map((geoCheck) => ({
					metadata: {
						monitorId: new mongoose.Types.ObjectId(geoCheck.metadata.monitorId),
						teamId: new mongoose.Types.ObjectId(geoCheck.metadata.teamId),
						type: geoCheck.metadata.type,
					},
					results: geoCheck.results,
					expiry: new Date(geoCheck.expiry),
				}))
			);
			return docs.map((doc) => this.toEntity(doc));
		} catch (error: any) {
			this.logger.error({
				message: `Failed to createGeoChecks: ${error.message}`,
				service: SERVICE_NAME,
				method: "createGeoChecks",
				stack: error.stack,
			});
			throw error;
		}
	};

	findByMonitorId = async (
		monitorId: string,
		sortOrder: string,
		dateRange: string,
		page: number,
		rowsPerPage: number,
		continent?: GeoContinent
	): Promise<GeoChecksQueryResult> => {
		try {
			const matchStage: Record<string, any> = {
				"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
				...(dateRangeLookup[dateRange] && {
					createdAt: {
						$gte: dateRangeLookup[dateRange],
					},
				}),
			};

			const convertedSortOrder = sortOrder === "asc" ? 1 : -1;

			let skip = 0;
			if (page && rowsPerPage) {
				skip = page * rowsPerPage;
			}

			if (continent) {
				const pipeline: any[] = [
					{ $match: matchStage },
					{ $unwind: "$results" },
					{
						$match: {
							"results.location.continent": continent,
						},
					},
					{
						$group: {
							_id: "$_id",
							doc: { $first: "$$ROOT" },
							results: { $push: "$results" },
						},
					},
					{
						$replaceRoot: {
							newRoot: {
								$mergeObjects: ["$doc", { results: "$results" }],
							},
						},
					},
					{ $sort: { createdAt: convertedSortOrder } },
					{ $skip: skip },
					{ $limit: rowsPerPage },
				];

				const [countPipeline, dataResults] = await Promise.all([
					GeoCheckModel.aggregate([
						{ $match: matchStage },
						{ $unwind: "$results" },
						{ $match: { "results.location.continent": continent } },
						{ $group: { _id: "$_id" } },
						{ $count: "count" },
					]),
					GeoCheckModel.aggregate(pipeline),
				]);

				const geoChecksCount = countPipeline[0]?.count || 0;
				const geoChecks = dataResults.map(this.toEntity);

				return { geoChecksCount, geoChecks };
			} else {
				const [geoChecksCount, docs] = await Promise.all([
					GeoCheckModel.countDocuments(matchStage),
					GeoCheckModel.find(matchStage).sort({ createdAt: convertedSortOrder }).skip(skip).limit(rowsPerPage).lean() as Promise<GeoCheckDocument[]>,
				]);

				return { geoChecksCount, geoChecks: docs.map(this.toEntity) };
			}
		} catch (error: any) {
			this.logger.error({
				message: `Error finding geo checks by monitor ID: ${error.message}`,
				service: SERVICE_NAME,
				method: "findByMonitorId",
				stack: error.stack,
			});
			throw error;
		}
	};

	findByMonitorIdAndDateRange = async (monitorId: string, startDate: Date, endDate: Date): Promise<GeoCheck[]> => {
		try {
			const docs = await GeoCheckModel.find({
				"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
				createdAt: {
					$gte: startDate,
					$lte: endDate,
				},
			}).sort({ createdAt: -1 });
			return docs.map(this.toEntity);
		} catch (error: any) {
			this.logger.error({
				message: `Error finding geo checks by monitor ID and date range: ${error.message}`,
				service: SERVICE_NAME,
				method: "findByMonitorIdAndDateRange",
			});
			throw error;
		}
	};

	findGroupedByMonitorIdAndDateRange = async (
		monitorId: string,
		startDate: Date,
		endDate: Date,
		dateFormat: string,
		continent?: string
	): Promise<GroupedGeoCheck[]> => {
		try {
			const pipeline: any[] = [
				// Match geo checks for this monitor in date range
				{
					$match: {
						"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
						createdAt: {
							$gte: startDate,
							$lte: endDate,
						},
					},
				},
				// Unwind the results array to process each location separately
				{
					$unwind: "$results",
				},
				// Filter by continent if specified
				...(continent
					? [
							{
								$match: {
									"results.location.continent": continent,
								},
							},
						]
					: []),
				// Group by date bucket and continent
				{
					$group: {
						_id: {
							bucketDate: {
								$dateToString: {
									format: dateFormat,
									date: "$createdAt",
								},
							},
							continent: "$results.location.continent",
						},
						avgResponseTime: { $avg: "$results.timings.total" },
						totalChecks: { $sum: 1 },
						upChecks: {
							$sum: {
								$cond: ["$results.status", 1, 0],
							},
						},
					},
				},
				// Calculate uptime percentage
				{
					$project: {
						_id: 0,
						bucketDate: "$_id.bucketDate",
						continent: "$_id.continent",
						avgResponseTime: { $round: ["$avgResponseTime", 2] },
						totalChecks: 1,
						uptimePercentage: {
							$round: [
								{
									$multiply: [
										{
											$divide: ["$upChecks", "$totalChecks"],
										},
										100,
									],
								},
								2,
							],
						},
					},
				},
				// Sort by date and continent
				{
					$sort: {
						bucketDate: 1,
						continent: 1,
					},
				},
			];

			const results = await GeoCheckModel.aggregate(pipeline);
			return results as GroupedGeoCheck[];
		} catch (error: any) {
			this.logger.error({
				message: `Error finding grouped geo checks: ${error.message}`,
				service: SERVICE_NAME,
				method: "findGroupedByMonitorIdAndDateRange",
			});
			throw error;
		}
	};

	deleteByMonitorId = async (monitorId: string): Promise<number> => {
		try {
			const result = await GeoCheckModel.deleteMany({
				"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
			});
			return result.deletedCount || 0;
		} catch (error: any) {
			this.logger.error({
				message: `Error deleting geo checks by monitor ID: ${error.message}`,
				service: SERVICE_NAME,
				method: "deleteByMonitorId",
			});
			throw error;
		}
	};

	deleteByTeamId = async (teamId: string): Promise<number> => {
		try {
			const result = await GeoCheckModel.deleteMany({
				"metadata.teamId": new mongoose.Types.ObjectId(teamId),
			});
			return result.deletedCount || 0;
		} catch (error: any) {
			this.logger.error({
				message: `Error deleting geo checks by team ID: ${error.message}`,
				service: SERVICE_NAME,
				method: "deleteByTeamId",
			});
			throw error;
		}
	};

	deleteByMonitorIdsNotIn = async (monitorIds: string[]): Promise<number> => {
		try {
			const objectIds = monitorIds.map((id) => new mongoose.Types.ObjectId(id));
			const result = await GeoCheckModel.deleteMany({ "metadata.monitorId": { $nin: objectIds } });
			return result.deletedCount || 0;
		} catch (error: any) {
			this.logger.error({
				message: `Error deleting orphaned geo checks: ${error.message}`,
				service: SERVICE_NAME,
				method: "deleteByMonitorIdsNotIn",
			});
			throw error;
		}
	};
}

export { MongoGeoChecksRepository };
export default MongoGeoChecksRepository;
