import type {
	Check,
	CheckAudits,
	CheckCpuInfo,
	CheckDiskInfo,
	CheckHostInfo,
	CheckMemoryInfo,
	CheckRaidArray,
	CheckSnapshot,
	SnapshotCpuInfo,
	SnapshotDiskInfo,
	SnapshotHostInfo,
	SnapshotMemoryInfo,
	SnapshotRaidArray,
} from "@/domain/checks/check.type.js";
import { DockerContainerSummary } from "@/domain/docker/docker.type.js";
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
	// Full arrays on a check, slim ones when re-reading a stored snapshot
	raid?: (CheckRaidArray | SnapshotRaidArray)[];
	audits?: CheckAudits;
	containerSummary?: DockerContainerSummary;
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
	disk
		?.filter((entry) => entry != null)
		.map((entry) => ({
			device: entry.device,
			mountpoint: entry.mountpoint,
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

const mapRaid = (raid?: (CheckRaidArray | SnapshotRaidArray)[]): SnapshotRaidArray[] | undefined =>
	raid
		?.filter((entry) => entry != null)
		.map((entry) => ({
			device: entry.device,
			state: entry.state,
			degraded_disks: entry.degraded_disks,
			sync_action: entry.sync_action,
			sync_progress: entry.sync_progress,
		}));

const mapAudits = (audits?: CheckAudits): CheckAudits | undefined =>
	audits && {
		cls: audits.cls,
		si: audits.si,
		fcp: audits.fcp,
		lcp: audits.lcp,
		tbt: audits.tbt,
	};

const mapContainerSummary = (summary?: DockerContainerSummary): DockerContainerSummary | undefined =>
	summary && { total: summary.total, running: summary.running, stopped: summary.stopped, unhealthy: summary.unhealthy };

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
	raid: mapRaid(source.raid),
	accessibility: source.accessibility,
	bestPractices: source.bestPractices,
	seo: source.seo,
	performance: source.performance,
	audits: mapAudits(source.audits),
	containerSummary: mapContainerSummary(source.containerSummary),
});
