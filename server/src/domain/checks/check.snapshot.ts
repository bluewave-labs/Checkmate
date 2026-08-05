import type {
	Check,
	CheckAudits,
	CheckCpuInfo,
	CheckDiskInfo,
	CheckHostInfo,
	CheckMemoryInfo,
	CheckSnapshot,
	SnapshotCpuInfo,
	SnapshotDiskInfo,
	SnapshotHostInfo,
	SnapshotMemoryInfo,
} from "@/domain/checks/check.type.js";
import { toDateString } from "@/utils/mongoMappers.js";

export type CheckSnapshotSource = Pick<
	Check,
	"id" | "status" | "responseTime" | "statusCode" | "message" | "accessibility" | "bestPractices" | "seo" | "performance"
> & {
	createdAt: string | Date;
	cpu?: CheckCpuInfo;
	memory?: CheckMemoryInfo;
	disk?: CheckDiskInfo[];
	host?: CheckHostInfo;
	audits?: CheckAudits;
};

const mapCpu = (cpu?: CheckCpuInfo): SnapshotCpuInfo | undefined =>
	cpu && {
		physical_core: cpu.physical_core,
		logical_core: cpu.logical_core,
		frequency: cpu.frequency,
		current_frequency: cpu.current_frequency,
		temperature: cpu.temperature,
		usage_percent: cpu.usage_percent,
	};

const mapMemory = (memory?: CheckMemoryInfo): SnapshotMemoryInfo | undefined =>
	memory && {
		total_bytes: memory.total_bytes,
		used_bytes: memory.used_bytes,
		usage_percent: memory.usage_percent,
	};

const mapDisk = (disk?: CheckDiskInfo[]): SnapshotDiskInfo[] | undefined =>
	disk?.map((entry) => ({
		device: entry.device,
		total_bytes: entry.total_bytes,
		used_bytes: entry.used_bytes,
		usage_percent: entry.usage_percent,
	}));

const mapHost = (host?: CheckHostInfo): SnapshotHostInfo | undefined =>
	host && {
		os: host.os,
		platform: host.platform,
		pretty_name: host.pretty_name,
	};

const mapAudits = (audits?: CheckAudits): CheckAudits | undefined =>
	audits && {
		cls: audits.cls,
		si: audits.si,
		fcp: audits.fcp,
		lcp: audits.lcp,
		tbt: audits.tbt,
	};

export const toCheckSnapshot = (source: CheckSnapshotSource): CheckSnapshot => ({
	id: source.id,
	status: source.status,
	responseTime: source.responseTime,
	statusCode: source.statusCode,
	message: source.message,
	createdAt: toDateString(source.createdAt),
	cpu: mapCpu(source.cpu),
	memory: mapMemory(source.memory),
	disk: mapDisk(source.disk),
	host: mapHost(source.host),
	accessibility: source.accessibility,
	bestPractices: source.bestPractices,
	seo: source.seo,
	performance: source.performance,
	audits: mapAudits(source.audits),
});
