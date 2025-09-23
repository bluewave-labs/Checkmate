import { migrateStatusWindowThreshold } from "./0001_migrateStatusWindowThreshold.js";

const runMigrations = async () => {
	await migrateStatusWindowThreshold();
};

export { runMigrations };
