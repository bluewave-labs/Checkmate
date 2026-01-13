import Monitor from "@/db/models/Monitor.js";
async function migrateStatusWindowThreshold() {
	const monitors = await Monitor.find({ statusWindowThreshold: { $lt: 1 } });
	for (const monitor of monitors) {
		monitor.statusWindowThreshold = monitor.statusWindowThreshold * 100;
		await monitor.save();
	}
}

export { migrateStatusWindowThreshold };
