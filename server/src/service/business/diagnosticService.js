import v8 from "v8";
import os from "os";

const SERVICE_NAME = "diagnosticService";

class DiagnosticService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor() {
		/**
		 * Performance Observer for monitoring system performance metrics.
		 * Clears performance marks after each measurement to prevent memory leaks.
		 */
		const obs = new PerformanceObserver((items) => {
			// Get the first entry but we don't need to store it
			items.getEntries()[0];
			performance.clearMarks();
		});
		obs.observe({ entryTypes: ["measure"] });
	}

	get serviceName() {
		return DiagnosticService.SERVICE_NAME;
	}

	getCPUUsage = async () => {
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
	};

	getSystemStats = async () => {
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

		return diagnostics;
	};
}

export default DiagnosticService;
