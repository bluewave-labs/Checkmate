import { IGeoChecksRepository } from "./IGeoChecksRepository.js";
import type { GeoCheck, GeoCheckMetadata, GeoCheckResult, GroupedGeoCheck, GeoContinent, FlatGeoCheck } from "@/types/geoCheck.js";
import type { FlatGeoChecksQueryResult } from "./IGeoChecksRepository.js";
import { GeoCheckMetadataDocument, GeoCheckModel, type GeoCheckDocument } from "@/db/models/index.js";
import mongoose, { PipelineStage } from "mongoose";
import { getDateForRange } from "@/utils/dataUtils.js";
import { ILogger } from "@/utils/logger.js";

const SERVICE_NAME = "GeoChecksRepository";

class MongoGeoChecksRepository implements IGeoChecksRepository {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: ILogger;
	constructor(logger: ILogger) {
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

		const mapMetadata = (metadata: GeoCheckMetadataDocument): GeoCheckMetadata => ({
			monitorId: toStringId(metadata.monitorId),
			teamId: toStringId(metadata.teamId),
			type: metadata.type,
		});

		const mapResults = (results: GeoCheckResult[]): GeoCheckResult[] => {
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
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? `Failed to createGeoChecks: ${error.message}` : "Failed to createGeoChecks",
				service: SERVICE_NAME,
				method: "createGeoChecks",
				stack: error instanceof Error ? error.stack : undefined,
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
		continents?: GeoContinent[]
	): Promise<FlatGeoChecksQueryResult> => {
		try {
			const matchStage: Record<string, unknown> = {
				"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
				...(getDateForRange(dateRange) && {
					createdAt: {
						$gte: getDateForRange(dateRange),
					},
				}),
			};

			const convertedSortOrder = sortOrder === "asc" ? 1 : -1;

			let skip = 0;
			if (page && rowsPerPage) {
				skip = page * rowsPerPage;
			}

			// Common pipeline stages for both paths
			const pipeline: PipelineStage[] = [
				{ $match: matchStage },
				{ $unwind: "$results" },
				// Filter by continent if specified
				...(continents && continents.length > 0
					? [
							{
								$match: {
									"results.location.continent": { $in: continents },
								},
							},
						]
					: []),
				// Project to flat structure
				{
					$project: {
						_id: 0,
						monitorId: "$metadata.monitorId",
						teamId: "$metadata.teamId",
						type: "$metadata.type",
						location: "$results.location",
						status: "$results.status",
						statusCode: "$results.statusCode",
						timings: "$results.timings",
						createdAt: 1,
						updatedAt: 1,
					},
				},
				{ $sort: { createdAt: convertedSortOrder } },
				{ $skip: skip },
				{ $limit: rowsPerPage },
			];

			// Count pipeline
			const countPipeline: PipelineStage[] = [
				{ $match: matchStage },
				{ $unwind: "$results" },
				...(continents && continents.length > 0
					? [
							{
								$match: {
									"results.location.continent": { $in: continents },
								},
							},
						]
					: []),
				{ $count: "count" },
			];

			const [countResult, dataResults] = await Promise.all([GeoCheckModel.aggregate(countPipeline), GeoCheckModel.aggregate(pipeline)]);

			const geoChecksCount = countResult[0]?.count || 0;
			const geoChecks: FlatGeoCheck[] = dataResults.map((doc) => ({
				id: `${doc.monitorId.toString()}-${new Date(doc.createdAt).getTime()}-${doc.location.continent}-${doc.location.city}-${Math.random().toString(36).substring(2, 15)}`,
				monitorId: doc.monitorId.toString(),
				teamId: doc.teamId.toString(),
				type: doc.type,
				location: doc.location,
				status: doc.status,
				statusCode: doc.statusCode,
				timings: doc.timings,
				createdAt: new Date(doc.createdAt).toISOString(),
				updatedAt: new Date(doc.updatedAt).toISOString(),
			}));

			return { geoChecksCount, geoChecks };
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? `Error finding geo checks by monitor ID: ${error.message}` : "Error finding geo checks by monitor ID",
				service: SERVICE_NAME,
				method: "findByMonitorId",
				stack: error instanceof Error ? error.stack : undefined,
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
		} catch (error: unknown) {
			this.logger.error({
				message:
					error instanceof Error
						? `Error finding geo checks by monitor ID and date range: ${error.message}`
						: "Error finding geo checks by monitor ID and date range",
				service: SERVICE_NAME,
				method: "findByMonitorIdAndDateRange",
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	};

	findGroupedByMonitorIdAndDateRange = async (
		monitorId: string,
		startDate: Date,
		endDate: Date,
		dateFormat: string,
		continents?: GeoContinent[]
	): Promise<GroupedGeoCheck[]> => {
		try {
			const pipeline: PipelineStage[] = [
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
				...(continents && continents.length > 0
					? [
							{
								$match: {
									"results.location.continent": { $in: continents },
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
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? `Error finding grouped geo checks: ${error.message}` : "Error finding grouped geo checks",
				service: SERVICE_NAME,
				method: "findGroupedByMonitorIdAndDateRange",
				stack: error instanceof Error ? error.stack : undefined,
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
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? `Error deleting geo checks by monitor ID: ${error.message}` : "Error deleting geo checks by monitor ID",
				service: SERVICE_NAME,
				method: "deleteByMonitorId",
				stack: error instanceof Error ? error.stack : undefined,
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
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? `Error deleting geo checks by team ID: ${error.message}` : "Error deleting geo checks by team ID",
				service: SERVICE_NAME,
				method: "deleteByTeamId",
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	};

	deleteByMonitorIdsNotIn = async (monitorIds: string[]): Promise<number> => {
		try {
			const objectIds = monitorIds.map((id) => new mongoose.Types.ObjectId(id));
			const result = await GeoCheckModel.deleteMany({ "metadata.monitorId": { $nin: objectIds } });
			return result.deletedCount || 0;
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? `Error deleting orphaned geo checks: ${error.message}` : "Error deleting orphaned geo checks",
				service: SERVICE_NAME,
				method: "deleteByMonitorIdsNotIn",
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	};
}

export { MongoGeoChecksRepository };
export default MongoGeoChecksRepository;
