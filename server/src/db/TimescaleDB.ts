import { IDb } from "@/db/IDb.js";
import { ILogger } from "@/utils/logger.js";
import { EnvConfig } from "@/service/system/settingsService.js";
import { Client, Pool } from "pg";
import { runTimescaleDBMigrations } from "@/db/migration/timescaledb/index.js";

const SERVICE_NAME = "TimescaleDB";

class TimescaleDB implements IDb {
	private pool: Pool | null = null;

	constructor(
		private logger: ILogger,
		private envSettings: EnvConfig
	) {}

	private ensureDatabaseExists = async (connectionString: string) => {
		const url = new URL(connectionString);
		const dbName = url.pathname.slice(1); // Remove leading "/"

		// Connect to the default "postgres" database
		url.pathname = "/postgres";
		const client = new Client({ connectionString: url.toString() });
		await client.connect();

		const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
		if (result.rowCount === 0) {
			await client.query(`CREATE DATABASE "${dbName}"`);
			this.logger.info({
				message: `Created database "${dbName}"`,
				service: SERVICE_NAME,
				method: "ensureDatabaseExists",
			});
		}
		await client.end();
	};

	connect = async () => {
		try {
			const connectionString = this.envSettings.dbConnectionString || "postgresql://postgres:password@localhost:5432/checkmate";

			await this.ensureDatabaseExists(connectionString);

			this.pool = new Pool({ connectionString });

			const client = await this.pool.connect();
			client.release();

			// Ensure TimescaleDB extension is enabled
			await this.pool.query("CREATE EXTENSION IF NOT EXISTS timescaledb;");

			this.logger.info({
				message: "Connected to TimescaleDB",
				service: SERVICE_NAME,
				method: "connect",
			});

			await runTimescaleDBMigrations(this.pool, this.logger);
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? error.message : "Unknown error",
				service: SERVICE_NAME,
				method: "connect",
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	};

	disconnect = async () => {
		try {
			if (this.pool === null) {
				return;
			}
			this.logger.info({
				message: "Disconnecting from TimescaleDB",
				service: SERVICE_NAME,
				method: "disconnect",
			});
			await this.pool.end();
			this.pool = null;
			this.logger.info({
				message: "Disconnected from TimescaleDB",
				service: SERVICE_NAME,
				method: "disconnect",
			});
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? error.message : "Unknown error",
				service: SERVICE_NAME,
				method: "disconnect",
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
	};

	getPool = (): Pool => {
		if (this.pool === null) {
			throw new Error("TimescaleDB is not connected. Call connect() first.");
		}
		return this.pool;
	};
}

export default TimescaleDB;
