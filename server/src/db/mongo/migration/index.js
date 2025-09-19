import { migrateStatusWindowThreshold } from "./0001_migrateStatusWindowThreshold.js";
import { addShowResponseTimeChart } from "./0002_addShowResponseTimeChart.js";

const runMigrations = async () => {
	await migrateStatusWindowThreshold();
	await addShowResponseTimeChart();
};

export { runMigrations };
