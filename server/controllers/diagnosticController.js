import v8 from "v8";
import os from "os";
import { asyncHandler } from "../utils/errorUtils.js";

const SERVICE_NAME = "diagnosticController";

const obs = new PerformanceObserver((items) => {
	const entry = items.getEntries()[0];
	performance.clearMarks();
});
obs.observe({ entryTypes: ["measure"] });
class DiagnosticController {
	constructor(db) {
		this.db = db;
		this.getMonitorsByTeamIdExecutionStats =
			this.getMonitorsByTeamIdExecutionStats.bind(this);
		this.getDbStats = this.getDbStats.bind(this);
	}

	getMonitorsByTeamIdExecutionStats = asyncHandler(
		async (req, res, next) => {
			const data = await this.db.getMonitorsByTeamIdExecutionStats(req);
			return res.success({
				msg: "OK",
				data,
			});
		},
		SERVICE_NAME,
		"getMonitorsByTeamIdExecutionStats"
	);

	getDbStats = asyncHandler(
		async (req, res, next) => {
			const { methodName, args = [] } = req.body;
			if (!methodName || !this.db[methodName]) {
				return res.error({
					msg: "Invalid method name or method doesn't exist",
					status: 400,
				});
			}
			const explainMethod = await this.db[methodName].apply(this.db, args);
			const stats = {
				methodName,
				timestamp: new Date(),
				explain: explainMethod,
			};
			return res.success({
				msg: "OK",
				data: stats,
			});
		},
		SERVICE_NAME,
		"getDbStats"
	);

	getCPUUsage = asyncHandler(
		async (req, res, next) => {
			const startUsage = process.cpuUsage();
			const timingPeriod = 1000; // measured in ms
			await new Promise((resolve) => setTimeout(resolve, timingPeriod));
			const endUsage = process.cpuUsage(startUsage);
			const cpuUsage = {
				userUsageMs: endUsage.user / 1000,
				systemUsageMs: endUsage.system / 1000,
				usagePercentage: ((endUsage.user + endUsage.system) / 1000 / timingPeriod) * 100,
			};
			return cpuUsage;
		},
		SERVICE_NAME,
		"getCPUUsage"
	);

	getSystemStats = asyncHandler(
		async (req, res, next) => {
			// Memory Usage
			const totalMemory = os.totalmem();
			const freeMemory = os.freemem();

			const osStats = {
				freeMemoryBytes: freeMemory, // bytes
				totalMemoryBytes: totalMemory, // bytes
			};

			const used = process.memoryUsage();
			const memoryUsage = {};
			for (let key in used) {
				memoryUsage[`${key}Mb`] = Math.round((used[key] / 1024 / 1024) * 100) / 100; // MB
			}

			// CPU Usage
			const cpuMetrics = await this.getCPUUsage();

			// V8 Heap Statistics
			const heapStats = v8.getHeapStatistics();
			const v8Metrics = {
				totalHeapSizeBytes: heapStats.total_heap_size, // bytes
				usedHeapSizeBytes: heapStats.used_heap_size, // bytes
				heapSizeLimitBytes: heapStats.heap_size_limit, // bytes
			};

			// Event Loop Delay
			let eventLoopDelay = 0;
			performance.mark("start");
			await new Promise((resolve) => setTimeout(resolve, 0));
			performance.mark("end");
			performance.measure("eventLoopDelay", "start", "end");
			const entries = performance.getEntriesByName("eventLoopDelay");
			if (entries.length > 0) {
				eventLoopDelay = entries[0].duration;
			}

			// Uptime
			const uptimeMs = process.uptime() * 1000; // ms

			// Combine Metrics
			const diagnostics = {
				osStats,
				memoryUsage,
				cpuUsage: cpuMetrics,
				v8HeapStats: v8Metrics,
				eventLoopDelayMs: eventLoopDelay,
				uptimeMs,
			};

			return res.success({
				msg: "OK",
				data: diagnostics,
			});
		},
		SERVICE_NAME,
		"getSystemStats"
	);
}
export default DiagnosticController;
