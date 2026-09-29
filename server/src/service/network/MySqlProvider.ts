import { IStatusProvider } from "@/service/network/IStatusProvider.js";
import { IAdvancedMatcher } from "@/service/network/AdvancedMatcher.js";
import { MySqlStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { Monitor, MonitorType } from "@/domain/monitors/monitor.type.js";
import { AppError } from "@/utils/AppError.js";
import { timeRequest } from "@/service/network/utils.js";
import { NETWORK_ERROR } from "@/types/network.js";

const SERVICE_NAME = "MySqlProvider";
const TIMEOUT_MS = 10000;
const DEFAULT_PORT = 3306;
const DEFAULT_QUERY = "SELECT 1";

export interface MySqlConnectionConfig {
	host: string;
	port: number;
	user?: string;
	password?: string;
	database?: string;
	connectTimeout: number;
}

export interface MySqlConnection {
	query(sql: string): Promise<unknown>;
	end(): Promise<void>;
	destroy?(): void;
}

/**
 * Structural type rather than an import of mysql2, so the provider stays unit-testable
 * with a fake and the concrete driver is injected by the registry.
 */
export interface MySqlDriver {
	createConnection(config: MySqlConnectionConfig): Promise<MySqlConnection>;
}

export class MySqlProvider implements IStatusProvider<MySqlStatusPayload> {
	readonly type = "mysql";

	constructor(
		private driver: MySqlDriver,
		private advancedMatcher: IAdvancedMatcher
	) {}

	supports(type: MonitorType): boolean {
		return type === "mysql";
	}

	async handle(monitor: Monitor): Promise<MonitorStatusResponse<MySqlStatusPayload>> {
		try {
			const { url } = monitor;
			if (!url) {
				throw new Error("URL is required for MySQL monitoring");
			}

			const query = monitor.dbQuery?.trim() || DEFAULT_QUERY;

			const { response, responseTime, error } = await timeRequest(async () => {
				return this.runQuery(monitor, query);
			});

			if (error) {
				const errorMessage = error instanceof Error ? error.message : "MySQL check failed";
				return {
					monitorId: monitor.id,
					teamId: monitor.teamId,
					type: monitor.type,
					status: false,
					code: NETWORK_ERROR,
					message: errorMessage,
					responseTime: responseTime,
					timings: undefined,
					payload: { rowCount: 0 },
				};
			}

			const payload: MySqlStatusPayload = response ?? { rowCount: 0 };
			// A query that runs proves the server is answering; advanced matching lets the
			// monitor additionally assert on the value it returned.
			const matchResult = this.advancedMatcher.validate<string | null | undefined>(payload.value, monitor);

			return {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
				status: matchResult.ok,
				code: matchResult.ok ? 200 : NETWORK_ERROR,
				message: matchResult.ok ? "MySQL check successful" : matchResult.message,
				responseTime: responseTime,
				timings: undefined,
				payload,
			};
		} catch (err: unknown) {
			if (err instanceof AppError) throw err;
			const originalMessage = err instanceof Error ? err.message : String(err);
			throw new AppError({
				message: originalMessage || "Error performing MySQL check",
				status: 500,
				service: SERVICE_NAME,
				method: "handle",
				details: { url: monitor.url, port: monitor.port, database: monitor.dbName },
			});
		}
	}

	/**
	 * Races the connect-and-query against a hard timeout. The connection is closed through
	 * the promise itself rather than a local variable, so a connection that finishes opening
	 * after the timeout has already fired is still closed — leaking those is the problem a
	 * port check has today.
	 */
	private async runQuery(monitor: Monitor, query: string): Promise<MySqlStatusPayload> {
		let connectionPromise: Promise<MySqlConnection> | undefined;
		let timer: NodeJS.Timeout | undefined;

		try {
			const work = (async () => {
				connectionPromise = this.driver.createConnection({
					host: monitor.url,
					port: monitor.port ?? DEFAULT_PORT,
					user: monitor.dbUser,
					password: monitor.secret,
					database: monitor.dbName,
					connectTimeout: TIMEOUT_MS,
				});

				const connection = await connectionPromise;
				const result = await connection.query(query);
				return this.toPayload(result);
			})();

			const timeout = new Promise<never>((_, reject) => {
				timer = setTimeout(() => reject(new Error("MySQL check timed out")), TIMEOUT_MS);
			});

			return await Promise.race([work, timeout]);
		} finally {
			if (timer) clearTimeout(timer);
			if (connectionPromise) {
				void connectionPromise
					.then(async (connection) => {
						try {
							await connection.end();
						} catch {
							connection.destroy?.();
						}
					})
					.catch(() => {
						// createConnection rejected; there is nothing to close.
					});
			}
		}
	}

	/**
	 * mysql2 resolves to [rows, fields]. Reduce that to a row count plus the first column of
	 * the first row, which is what a health query like `SELECT 1` or `SELECT status FROM ...`
	 * is actually asserting on.
	 */
	private toPayload(result: unknown): MySqlStatusPayload {
		const rows = Array.isArray(result) ? result[0] : result;
		if (!Array.isArray(rows)) {
			return { rowCount: 0 };
		}

		const firstRow = rows[0];
		if (firstRow === undefined) {
			return { rowCount: 0 };
		}

		const raw = firstRow !== null && typeof firstRow === "object" ? Object.values(firstRow as Record<string, unknown>)[0] : firstRow;

		return {
			rowCount: rows.length,
			value: raw === null || raw === undefined ? null : String(raw),
		};
	}
}
