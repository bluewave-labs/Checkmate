import StatusPage from "../../models/StatusPage.js";

async function addShowResponseTimeChart() {
	try {
		const statusPages = await StatusPage.find({ showResponseTimeChart: { $exists: false } });
		for (const statusPage of statusPages) {
			statusPage.showResponseTimeChart = false;
			await statusPage.save();
			console.log(`Migrated status page ${statusPage._id}: showResponseTimeChart set to ${statusPage.showResponseTimeChart}`);
		}
		console.log("showResponseTimeChart migration complete.");
		return true;
	} catch (err) {
		console.error("Migration error:", err);
		return false;
	}
}

export { addShowResponseTimeChart };