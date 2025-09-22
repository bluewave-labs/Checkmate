import { migrateStatusWindowThreshold } from "./0001_migrateStatusWindowThreshold.js";
import { migrateUsers } from "./0002_migrateUsers.js";

const runMigrations = async () => {
	await migrateStatusWindowThreshold();
	await migrateUsers();
};

export { runMigrations };
