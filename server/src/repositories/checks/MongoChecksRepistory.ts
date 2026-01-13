import { IChecksRepository } from "@/repositories/index.js";
import type {
	Check,
	CheckAudits,
	CheckCaptureInfo,
	CheckCpuInfo,
	CheckDiskInfo,
	CheckErrorInfo,
	CheckHostInfo,
	CheckMemoryInfo,
	CheckMetadata,
	CheckNetworkInterfaceInfo,
	CheckTimings,
} from "@/types/index.js";
import { CheckModel, type CheckDocument } from "@/db/models/index.js";
import mongoose from "mongoose";

export type LatestChecksMap = Record<string, Check[]>;

class MongoChecksRepistory implements IChecksRepository {
	private toEntity = (doc: CheckDocument): Check => {
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

		const toOptionalDateString = (value?: Date | string | null): string | undefined => {
			if (!value) {
				return undefined;
			}
			return toDateString(value);
		};

		const mapTimings = (timings?: CheckTimings): CheckTimings => {
			const phases = timings?.phases ?? {
				wait: 0,
				dns: 0,
				tcp: 0,
				tls: 0,
				request: 0,
				firstByte: 0,
				download: 0,
				total: 0,
			};

			return {
				start: timings?.start ?? 0,
				socket: timings?.socket ?? 0,
				lookup: timings?.lookup ?? 0,
				connect: timings?.connect ?? 0,
				secureConnect: timings?.secureConnect ?? 0,
				upload: timings?.upload ?? 0,
				response: timings?.response ?? 0,
				end: timings?.end ?? 0,
				phases,
			};
		};

		const mapCpu = (cpu?: CheckCpuInfo): CheckCpuInfo => ({
			physical_core: cpu?.physical_core ?? 0,
			logical_core: cpu?.logical_core ?? 0,
			frequency: cpu?.frequency ?? 0,
			temperature: cpu?.temperature ?? [],
			free_percent: cpu?.free_percent ?? 0,
			usage_percent: cpu?.usage_percent ?? 0,
		});

		const mapMemory = (memory?: CheckMemoryInfo): CheckMemoryInfo => ({
			total_bytes: memory?.total_bytes ?? 0,
			available_bytes: memory?.available_bytes ?? 0,
			used_bytes: memory?.used_bytes ?? 0,
			usage_percent: memory?.usage_percent ?? 0,
		});

		const mapHost = (host?: CheckHostInfo): CheckHostInfo => ({
			os: host?.os ?? "",
			platform: host?.platform ?? "",
			kernel_version: host?.kernel_version ?? "",
		});

		const mapCapture = (capture?: CheckCaptureInfo): CheckCaptureInfo => ({
			version: capture?.version ?? "",
			mode: capture?.mode ?? "",
		});

		const mapDisks = (disks?: CheckDiskInfo[]): CheckDiskInfo[] =>
			(disks ?? []).map((disk) => ({
				device: disk?.device ?? "",
				mountpoint: disk?.mountpoint ?? "",
				read_speed_bytes: disk?.read_speed_bytes ?? 0,
				write_speed_bytes: disk?.write_speed_bytes ?? 0,
				total_bytes: disk?.total_bytes ?? 0,
				free_bytes: disk?.free_bytes ?? 0,
				usage_percent: disk?.usage_percent ?? 0,
			}));

		const mapErrors = (errors?: CheckErrorInfo[]): CheckErrorInfo[] =>
			(errors ?? []).map((error) => ({
				metric: error?.metric ?? [],
				err: error?.err ?? "",
			}));

		const mapNet = (net?: CheckNetworkInterfaceInfo[]): CheckNetworkInterfaceInfo[] =>
			(net ?? []).map((iface) => ({
				name: iface?.name ?? "",
				bytes_sent: iface?.bytes_sent ?? 0,
				bytes_recv: iface?.bytes_recv ?? 0,
				packets_sent: iface?.packets_sent ?? 0,
				packets_recv: iface?.packets_recv ?? 0,
				err_in: iface?.err_in ?? 0,
				err_out: iface?.err_out ?? 0,
				drop_in: iface?.drop_in ?? 0,
				drop_out: iface?.drop_out ?? 0,
				fifo_in: iface?.fifo_in ?? 0,
				fifo_out: iface?.fifo_out ?? 0,
			}));

		const mapAudits = (audits?: CheckAudits): CheckAudits | undefined => {
			if (!audits) {
				return undefined;
			}
			return {
				cls: audits.cls ?? 0,
				si: audits.si ?? 0,
				fcp: audits.fcp ?? 0,
				lcp: audits.lcp ?? 0,
				tbt: audits.tbt ?? 0,
			};
		};

		const mapMetadata = (metadata: CheckDocument["metadata"]): CheckMetadata => ({
			monitorId: toStringId(metadata.monitorId),
			teamId: toStringId(metadata.teamId),
			type: metadata.type,
		});

		return {
			id: toStringId(doc._id),
			metadata: mapMetadata(doc.metadata),
			status: doc.status ?? false,
			responseTime: doc.responseTime ?? 0,
			timings: mapTimings(doc.timings),
			statusCode: doc.statusCode ?? 0,
			message: doc.message ?? "",
			ack: doc.ack ?? false,
			ackAt: toOptionalDateString(doc.ackAt),
			expiry: toDateString(doc.expiry),
			cpu: mapCpu(doc.cpu),
			memory: mapMemory(doc.memory),
			disk: mapDisks(doc.disk),
			host: mapHost(doc.host),
			errors: mapErrors(doc.errors),
			capture: mapCapture(doc.capture),
			net: mapNet(doc.net),
			accessibility: doc.accessibility,
			bestPractices: doc.bestPractices,
			seo: doc.seo,
			performance: doc.performance,
			audits: mapAudits(doc.audits),
			__v: doc.__v ?? 0,
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	findLatestChecksByMonitorIds = async (monitorIds: string[]): Promise<LatestChecksMap> => {
		if (monitorIds.length === 0) {
			return {};
		}
		const mongoIds = monitorIds.map((id) => new mongoose.Types.ObjectId(id));
		const limitPerMonitor = 25;
		const checkGroups = await CheckModel.aggregate([
			{
				$match: {
					"metadata.monitorId": { $in: mongoIds },
				},
			},
			{
				$group: {
					_id: "$metadata.monitorId",
					latestChecks: {
						$topN: {
							n: limitPerMonitor,
							sortBy: { createdAt: -1 },
							output: "$$ROOT",
						},
					},
				},
			},
		]);
		return checkGroups.reduce<LatestChecksMap>((acc, group) => {
			const monitorId = group._id.toString();
			acc[monitorId] = (group.latestChecks ?? []).map((doc: CheckDocument) => this.toEntity(doc));
			return acc;
		}, {});
	};
}

export default MongoChecksRepistory;
