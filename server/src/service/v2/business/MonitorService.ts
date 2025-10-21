import mongoose from "mongoose";

import { IMonitor, Monitor, ITokenizedUser, MonitorStats, Check } from "../../../db/v2/models/index.js";
import ApiError from "../../../utils/ApiError.js";
import { IJobQueue } from "../infrastructure/JobQueue.js";
import { MonitorWithChecksResponse } from "../../../types/index.js";
import { MonitorStatus, MonitorType } from "../../../db/v2/models/monitors/Monitor.js";

const SERVICE_NAME = "MonitorServiceV2";

export interface IMonitorService {
	create: (tokenizedUser: ITokenizedUser, monitorData: IMonitor) => Promise<IMonitor>;
	getAll: () => Promise<IMonitor[]>;
	getAllEmbedChecks: (page: number, limit: number, type: MonitorType[]) => Promise<any[]>;
	get: (monitorId: string) => Promise<IMonitor>;
	getEmbedChecks: (monitorId: string, range: string, status?: string) => Promise<MonitorWithChecksResponse>;
	toggleActive: (monitorId: string, tokenizedUser: ITokenizedUser) => Promise<IMonitor>;
	update: (tokenizedUser: ITokenizedUser, monitorId: string, updateData: Partial<IMonitor>) => Promise<IMonitor>;
	delete: (monitorId: string) => Promise<boolean>;
	bulkToggleActive: (monitorIds: string[], isActive: boolean, tokenizedUser: ITokenizedUser) => Promise<void>;
	bulkDelete: (monitorIds: string[]) => Promise<void>;
	bulkUpdateNotifications: (monitorIds: string[], notificationChannels: any[], tokenizedUser: ITokenizedUser) => Promise<void>;
}

class MonitorService implements IMonitorService {
	static SERVICE_NAME = SERVICE_NAME;
	private jobQueue: IJobQueue;
	constructor(jobQueue: IJobQueue) {
		this.jobQueue = jobQueue;
	}

	create = async (tokenizedUser: ITokenizedUser, monitorData: IMonitor) => {
		const monitor = await Monitor.create({
			...monitorData,
			createdBy: tokenizedUser.sub,
			updatedBy: tokenizedUser.sub,
		});
		await MonitorStats.create({
			monitorId: monitor._id,
			currentStreakStartedAt: Date.now(),
		});
		await this.jobQueue.addJob(monitor);
		return monitor;
	};

	getAll = async () => {
		return Monitor.find();
	};

	getAllEmbedChecks = async (page: number, limit: number, type: MonitorType[] = []) => {
		const skip = (page - 1) * limit;
		let find = {};
		if (type.length > 0) find = { type: { $in: type } };
		const monitors = await Monitor.find(find).skip(skip).limit(limit);
		return monitors;
	};

	get = async (monitorId: string) => {
		const monitor = await Monitor.findById(monitorId);
		if (!monitor) {
			throw new ApiError("Monitor not found", 404);
		}
		return monitor;
	};

	private getStartDate(range: string): Date {
		const now = new Date();
		switch (range) {
			case "2h":
				return new Date(now.getTime() - 2 * 60 * 60 * 1000);
			case "24h":
				return new Date(now.getTime() - 24 * 60 * 60 * 1000);
			case "7d":
				return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			case "30d":
				return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			default:
				throw new ApiError("Invalid range parameter", 400);
		}
	}

	private getDateFormat(range: string): string {
		switch (range) {
			case "2h":
				return "%Y-%m-%dT%H:%M:00Z";
			case "24h":
			case "7d":
				return "%Y-%m-%dT%H:00:00Z";
			case "30d":
				return "%Y-%m-%d";
			default:
				throw new ApiError("Invalid range parameter", 400);
		}
	}

	private getBaseGroup = (dateFormat: string): Record<string, any> => {
		return {
			_id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
			count: { $sum: 1 },
			avgResponseTime: { $avg: "$responseTime" },
		};
	};

	private getBaseProjection = (): object => {
		return { status: 1, responseTime: 1, createdAt: 1 };
	};

	private getPageSpeedGroup = (dateFormat: string): Record<string, any> => {
		return {
			_id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
			count: { $sum: 1 },
			avgResponseTime: { $avg: "$responseTime" },
			accessibility: { $avg: "$lighthouse.accessibility" },
			bestPractices: { $avg: "$lighthouse.bestPractices" },
			seo: { $avg: "$lighthouse.seo" },
			performance: { $avg: "$lighthouse.performance" },
			cls: { $avg: "$lighthouse.audits.cls.score" },
			si: { $avg: "$lighthouse.audits.si.score" },
			fcp: { $avg: "$lighthouse.audits.fcp.score" },
			lcp: { $avg: "$lighthouse.audits.lcp.score" },
			tbt: { $avg: "$lighthouse.audits.tbt.score" },
		};
	};

	private getPageSpeedProjection = (): object => {
		const projectStage: any = { status: 1, responseTime: 1, createdAt: 1 };
		projectStage["lighthouse.accessibility"] = 1;
		projectStage["lighthouse.seo"] = 1;
		projectStage["lighthouse.bestPractices"] = 1;
		projectStage["lighthouse.performance"] = 1;
		projectStage["lighthouse.audits.cls.score"] = 1;
		projectStage["lighthouse.audits.si.score"] = 1;
		projectStage["lighthouse.audits.fcp.score"] = 1;
		projectStage["lighthouse.audits.lcp.score"] = 1;
		projectStage["lighthouse.audits.tbt.score"] = 1;
		return projectStage;
	};

	private getInfraGroup = (dateFormat: string): Record<string, any> => {
		return {
			_id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
			count: { $sum: 1 },
			avgResponseTime: { $avg: "$responseTime" },
			physicalCores: { $last: "$system.cpu.physical_core" },
			logicalCores: { $last: "$system.cpu.logical_core" },
			frequency: { $avg: "$system.cpu.frequency" },
			currentFrequency: { $last: "$system.cpu.current_frequency" },
			tempsArrays: { $push: "$system.cpu.temperature" },
			freePercent: { $avg: "$system.cpu.free_percent" },
			usedPercent: { $avg: "$system.cpu.usage_percent" },
			total_bytes: { $last: "$system.memory.total_bytes" },
			available_bytes: { $last: "$system.memory.available_bytes" },
			used_bytes: { $last: "$system.memory.used_bytes" },
			memory_usage_percent: { $avg: "$system.memory.usage_percent" },
			disksArray: { $push: "$system.disk" },
			os: { $last: "$system.host.os" },
			platform: { $last: "$system.host.platform" },
			kernel_version: { $last: "$system.host.kernel_version" },
			pretty_name: { $last: "$system.host.pretty_name" },
			netsArray: { $push: "$system.net" },
		};
	};

	private getInfraProjection = (): object => {
		const projectStage: any = { status: 1, responseTime: 1, createdAt: 1 };
		projectStage["system.cpu.physical_core"] = 1;
		projectStage["system.cpu.logical_core"] = 1;
		projectStage["system.cpu.frequency"] = 1;
		projectStage["system.cpu.current_frequency"] = 1;
		projectStage["system.cpu.temperature"] = 1;
		projectStage["system.cpu.free_percent"] = 1;
		projectStage["system.cpu.usage_percent"] = 1;
		projectStage["system.memory.total_bytes"] = 1;
		projectStage["system.memory.available_bytes"] = 1;
		projectStage["system.memory.used_bytes"] = 1;
		projectStage["system.memory.usage_percent"] = 1;
		projectStage["system.disk"] = 1;
		projectStage["system.host.os"] = 1;
		projectStage["system.host.platform"] = 1;
		projectStage["system.host.kernel_version"] = 1;
		projectStage["system.host.pretty_name"] = 1;
		projectStage["system.net"] = 1;
		return projectStage;
	};

	private getFinalProjection = (type: string): object => {
		if (type === "pagespeed") {
			return {
				_id: 1,
				count: 1,
				avgResponseTime: 1,
				accessibility: "$accessibility",
				seo: "$seo",
				bestPractices: "$bestPractices",
				performance: "$performance",
				cls: "$cls",
				si: "$si",
				fcp: "$fcp",
				lcp: "$lcp",
				tbt: "$tbt",
			};
		}

		if (type === "infrastructure") {
			return {
				_id: 1,
				count: 1,
				avgResponseTime: 1,
				cpu: {
					physicalCores: "$physicalCores",
					logicalCores: "$logicalCores",
					frequency: "$frequency",
					currentFrequency: "$currentFrequency",
					temperatures: {
						$map: {
							input: {
								$range: [0, { $size: { $arrayElemAt: ["$tempsArrays", 0] } }],
							},
							as: "idx",
							in: {
								$avg: {
									$map: {
										input: "$tempsArrays",
										as: "arr",
										in: { $arrayElemAt: ["$$arr", "$$idx"] },
									},
								},
							},
						},
					},
					freePercent: "$freePercent",
					usedPercent: "$usedPercent",
				},
				memory: {
					total_bytes: "$total_bytes",
					available_bytes: "$available_bytes",
					used_bytes: "$used_bytes",
					usage_percent: "$memory_usage_percent",
				},
				disks: {
					$map: {
						input: {
							$range: [0, { $size: { $arrayElemAt: ["$disksArray", 0] } }],
						},
						as: "idx",
						in: {
							$let: {
								vars: {
									diskGroup: {
										$map: {
											input: "$disksArray",
											as: "diskArr",
											in: { $arrayElemAt: ["$$diskArr", "$$idx"] },
										},
									},
								},
								in: {
									device: { $arrayElemAt: ["$$diskGroup.device", 0] },
									total_bytes: { $avg: "$$diskGroup.total_bytes" },
									free_bytes: { $avg: "$$diskGroup.free_bytes" },
									used_bytes: { $avg: "$$diskGroup.used_bytes" },
									usage_percent: { $avg: "$$diskGroup.usage_percent" },
									total_inodes: { $avg: "$$diskGroup.total_inodes" },
									free_inodes: { $avg: "$$diskGroup.free_inodes" },
									used_inodes: { $avg: "$$diskGroup.used_inodes" },
									inodes_usage_percent: {
										$avg: "$$diskGroup.inodes_usage_percent",
									},
									read_bytes: { $avg: "$$diskGroup.read_bytes" },
									write_bytes: { $avg: "$$diskGroup.write_bytes" },
									read_time: { $avg: "$$diskGroup.read_time" },
									write_time: { $avg: "$$diskGroup.write_time" },
								},
							},
						},
					},
				},
				host: {
					os: "$os",
					platform: "$platform",
					kernel_version: "$kernel_version",
					pretty_name: "$pretty_name",
				},
				net: {
					$map: {
						input: {
							$range: [0, { $size: { $arrayElemAt: ["$netsArray", 0] } }],
						},
						as: "idx",
						in: {
							$let: {
								vars: {
									netGroup: {
										$map: {
											input: "$netsArray",
											as: "netArr",
											in: { $arrayElemAt: ["$$netArr", "$$idx"] },
										},
									},
								},
								in: {
									name: { $arrayElemAt: ["$$netGroup.name", 0] },
									bytes_sent: { $avg: "$$netGroup.bytes_sent" },
									bytes_recv: { $avg: "$$netGroup.bytes_recv" },
									packets_sent: { $avg: "$$netGroup.packets_sent" },
									packets_recv: { $avg: "$$netGroup.packets_recv" },
									err_in: { $avg: "$$netGroup.err_in" },
									err_out: { $avg: "$$netGroup.err_out" },
									drop_in: { $avg: "$$netGroup.drop_in" },
									drop_out: { $avg: "$$netGroup.drop_out" },
									fifo_in: { $avg: "$$netGroup.fifo_in" },
									fifo_out: { $avg: "$$netGroup.fifo_out" },
								},
							},
						},
					},
				},
			};
		}
		return {};
	};

	getEmbedChecks = async (monitorId: string, range: string, status: string | undefined): Promise<MonitorWithChecksResponse> => {
		const monitor = await Monitor.findById(monitorId);
		if (!monitor) {
			throw new ApiError("Monitor not found", 404);
		}
		const startDate = this.getStartDate(range);
		const dateFormat = this.getDateFormat(range);

		// Build match stage
		const matchStage: {
			monitorId: mongoose.Types.ObjectId;
			createdAt: { $gte: Date };
			status?: string;
		} = {
			monitorId: monitor._id,
			createdAt: { $gte: startDate },
		};

		if (status) {
			matchStage.status = status;
		}

		let groupClause;

		if (monitor.type === "pagespeed") {
			groupClause = this.getPageSpeedGroup(dateFormat);
		} else if (monitor.type === "infrastructure") {
			groupClause = this.getInfraGroup(dateFormat);
		} else {
			groupClause = this.getBaseGroup(dateFormat);
		}

		let projectStage;
		if (monitor.type === "pagespeed") {
			projectStage = this.getPageSpeedProjection();
		} else if (monitor.type === "infrastructure") {
			projectStage = this.getInfraProjection();
		} else {
			projectStage = this.getBaseProjection();
		}

		let finalProjection = {};
		if (monitor.type === "pagespeed" || monitor.type === "infrastructure") {
			finalProjection = this.getFinalProjection(monitor.type);
		} else {
			finalProjection = { _id: 1, count: 1, avgResponseTime: 1 };
		}

		const checks = await Check.aggregate([
			{
				$match: matchStage,
			},
			{ $sort: { createdAt: 1 } },
			{ $project: projectStage },
			{ $group: groupClause },
			{ $sort: { _id: -1 } },
			{
				$project: finalProjection,
			},
		]);

		// Get monitor stats
		const monitorStats = await MonitorStats.findOne({
			monitorId: monitor._id,
		}).lean();

		if (!monitorStats) {
			throw new ApiError("Monitor stats not found", 404);
		}

		return {
			monitor: monitor.toObject(),
			checks,
			stats: monitorStats,
		};
	};

	async toggleActive(id: string, tokenizedUser: ITokenizedUser) {
		const pendingStatus: MonitorStatus = "initializing";
		const updatedMonitor = await Monitor.findOneAndUpdate(
			{ _id: id },
			[
				{
					$set: {
						isActive: { $not: "$isActive" },
						status: pendingStatus,
						updatedBy: tokenizedUser.sub,
						updatedAt: new Date(),
					},
				},
			],
			{ new: true }
		);

		if (!updatedMonitor) {
			throw new ApiError("Monitor not found", 404);
		}

		await this.jobQueue.updateJob(updatedMonitor);

		if (updatedMonitor?.isActive) {
			await this.jobQueue.resumeJob(updatedMonitor);
		} else {
			await this.jobQueue.pauseJob(updatedMonitor);
		}
		return updatedMonitor;
	}

	async update(tokenizedUser: ITokenizedUser, monitorId: string, updateData: Partial<IMonitor>) {
		const allowedFields: (keyof IMonitor)[] = ["name", "interval", "isActive", "n", "notificationChannels"];
		const safeUpdate: Partial<IMonitor> = {};

		for (const field of allowedFields) {
			if (updateData[field] !== undefined) {
				(safeUpdate as any)[field] = updateData[field];
			}
		}

		const updatedMonitor = await Monitor.findByIdAndUpdate(
			monitorId,
			{
				$set: {
					...safeUpdate,
					updatedAt: new Date(),
					updatedBy: tokenizedUser.sub,
				},
			},
			{ new: true, runValidators: true }
		);

		if (!updatedMonitor) {
			throw new ApiError("Monitor not found", 404);
		}
		await this.jobQueue.updateJob(updatedMonitor);
		return updatedMonitor;
	}

	async delete(monitorId: string) {
		const monitor = await Monitor.findById(monitorId);
		if (!monitor) {
			throw new ApiError("Monitor not found", 404);
		}
		await monitor.deleteOne();
		await this.jobQueue.deleteJob(monitor);
		return true;
	}

	async bulkToggleActive(monitorIds: string[], isActive: boolean, tokenizedUser: ITokenizedUser) {
		const pendingStatus: MonitorStatus = "initializing";

		await Promise.all(
			monitorIds.map(async (monitorId) => {
				const updatedMonitor = await Monitor.findByIdAndUpdate(
					monitorId,
					{
						$set: {
							isActive,
							status: pendingStatus,
							updatedBy: tokenizedUser.sub,
							updatedAt: new Date(),
						},
					},
					{ new: true }
				);

				if (!updatedMonitor) {
					throw new ApiError("Monitor not found", 404);
				}

				await this.jobQueue.updateJob(updatedMonitor);

				if (updatedMonitor.isActive) {
					await this.jobQueue.resumeJob(updatedMonitor);
				} else {
					await this.jobQueue.pauseJob(updatedMonitor);
				}
			})
		);
	}

	async bulkDelete(monitorIds: string[]) {
		await Promise.all(
			monitorIds.map(async (monitorId) => {
				const monitor = await Monitor.findById(monitorId);
				if (!monitor) {
					throw new ApiError("Monitor not found", 404);
				}
				await monitor.deleteOne();
				await this.jobQueue.deleteJob(monitor);
			})
		);
	}

	async bulkUpdateNotifications(monitorIds: string[], notificationChannels: any[], tokenizedUser: ITokenizedUser) {
		await Promise.all(
			monitorIds.map(async (monitorId) => {
				const updatedMonitor = await Monitor.findByIdAndUpdate(
					monitorId,
					{
						$set: {
							notificationChannels,
							updatedAt: new Date(),
							updatedBy: tokenizedUser.sub,
						},
					},
					{ new: true, runValidators: true }
				);

				if (!updatedMonitor) {
					throw new ApiError("Monitor not found", 404);
				}

				await this.jobQueue.updateJob(updatedMonitor);
			})
		);
	}
}

export default MonitorService;
