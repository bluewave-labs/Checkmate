import { migrateStatusWindowThreshold, MIGRATION_NAME as MIGRATION_0001 } from "./0001_migrateStatusWindowThreshold.js";
import { migrateUsers, MIGRATION_NAME as MIGRATION_0002 } from "./0002_migrateUsers.js";
import { Migration, IMigration } from "../../models/index.js";

const runMigrations = async () => {
	const migrations = [
		{ name: MIGRATION_0001, migration: migrateStatusWindowThreshold },
		{ name: MIGRATION_0002, migration: migrateUsers },
	];

	const migrationNames = migrations.map((m) => m.name);

	const appliedMigrations = await Migration.find({ name: { $in: migrationNames }, success: true });

	const migrationsToRun = migrations.filter((m) => !appliedMigrations.some((am: IMigration) => am.name === m.name));

	for (const { name, migration } of migrationsToRun) {
		console.log(`Running migration: ${name}`);
		const success = await migration();
		await Migration.updateOne({ name }, { $set: { runAt: new Date(), success } }, { upsert: true });
		console.log(`Migration ${name} completed with status: ${success ? "success" : "failure"}`);
	}
};

export { runMigrations };
