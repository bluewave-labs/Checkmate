import { handleError } from "./controllerUtils.js";
import v8 from "v8";
import os from "os";

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

	async getMonitorsByTeamIdExecutionStats(req, res, next) {
		try {
			const data = await this.db.getMonitorsByTeamIdExecutionStats(req);
			return res.success({
				msg: "OK",
				data,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getMonitorsByTeamIdExecutionStats"));
		}
	}

	async getDbStats(req, res, next) {
		try {
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
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getDbStats"));
		}
	}

	async getSystemStats(req, res, next) {
		try {
			// Memory Usage
			const totalMemory = os.totalmem();
			const freeMemory = os.freemem();

			const osStats = {
				freeMemoryMb: freeMemory / 1024 / 1024, // MB
				totalMemoryMb: totalMemory / 1024 / 1024, // MB
			};

			const used = process.memoryUsage();
			const memoryUsage = {};
			for (let key in used) {
				memoryUsage[`${key}Mb`] = Math.round((used[key] / 1024 / 1024) * 100) / 100; // MB
			}

			// CPU Usage
			const cpuUsage = process.cpuUsage();
			const cpuMetrics = {
				userUsageMs: cpuUsage.user / 1000, // ms
				systemUsageMs: cpuUsage.system / 1000, // ms
			};

			// V8 Heap Statistics
			const heapStats = v8.getHeapStatistics();
			const v8Metrics = {
				totalHeapSizeMb: heapStats.total_heap_size / 1024 / 1024, // MB
				usedHeapSizeMb: heapStats.used_heap_size / 1024 / 1024, // MB
				heapSizeLimitMb: heapStats.heap_size_limit / 1024 / 1024, // MB
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
			const uptime = process.uptime(); // seconds

			// Combine Metrics
			const diagnostics = {
				osStats,
				memoryUsage,
				cpuUsage: cpuMetrics,
				v8HeapStats: v8Metrics,
				eventLoopDelayMs: eventLoopDelay,
				uptimeSeconds: uptime,
			};

			return res.success({
				msg: "OK",
				data: diagnostics,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getMemoryUsage"));
		}
	}
}
export default DiagnosticController;
