import Monitor from "../../models/Monitor.js";
async function migrateStatusWindowThreshold() {
	try {
		const monitors = await Monitor.find({ statusWindowThreshold: { $lt: 1 } });
		for (const monitor of monitors) {
			monitor.statusWindowThreshold = monitor.statusWindowThreshold * 100;
			await monitor.save();
			console.log(`Migrated monitor ${monitor._id}: statusWindowThreshold set to ${monitor.statusWindowThreshold}`);
		}
		console.log("StatusWindowThreshold migration complete.");
		return true;
	} catch (err) {
		console.error("Migration error:", err);
		return false;
	}
}

export { migrateStatusWindowThreshold };
