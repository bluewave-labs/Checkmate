import type { Pool } from "pg";
import type { ISettingsRepository } from "./ISettingsRepository.js";
import type { Settings, SettingsUpdate } from "@/types/settings.js";

interface SettingsRow {
	id: string;
	check_ttl: number;
	language: string | null;
	jwt_secret: string | null;
	pagespeed_api_key: string | null;
	system_email_host: string | null;
	system_email_port: number | null;
	system_email_address: string | null;
	system_email_password: string | null;
	system_email_user: string | null;
	system_email_connection_host: string | null;
	system_email_tls_servername: string | null;
	system_email_secure: boolean | null;
	system_email_pool: boolean | null;
	system_email_ignore_tls: boolean | null;
	system_email_require_tls: boolean | null;
	system_email_reject_unauthorized: boolean | null;
	show_url: boolean | null;
	default_user_agent: string | null;
	version: string | null;
	threshold_cpu_usage: number | null;
	threshold_memory_usage: number | null;
	threshold_disk_usage: number | null;
	threshold_temperature: number | null;
	created_at: Date;
	updated_at: Date;
}

const COLUMNS = `id, check_ttl, language, jwt_secret, pagespeed_api_key,
	system_email_host, system_email_port, system_email_address, system_email_password, system_email_user,
	system_email_connection_host, system_email_tls_servername, system_email_secure, system_email_pool,
	system_email_ignore_tls, system_email_require_tls, system_email_reject_unauthorized,
	show_url, default_user_agent, version, threshold_cpu_usage, threshold_memory_usage, threshold_disk_usage, threshold_temperature,
	created_at, updated_at`;

export class TimescaleSettingsRepository implements ISettingsRepository {
	constructor(private pool: Pool) {}

	create = async (settings: Partial<Settings>): Promise<Settings> => {
		const result = await this.pool.query<SettingsRow>(
			`INSERT INTO app_settings (check_ttl, language, jwt_secret, pagespeed_api_key,
				system_email_host, system_email_port, system_email_address, system_email_password, system_email_user,
				system_email_connection_host, system_email_tls_servername, system_email_secure, system_email_pool,
				system_email_ignore_tls, system_email_require_tls, system_email_reject_unauthorized,
				show_url, default_user_agent, version, threshold_cpu_usage, threshold_memory_usage, threshold_disk_usage, threshold_temperature)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
			 RETURNING ${COLUMNS}`,
			[
				settings.checkTTL ?? 30,
				settings.language ?? null,
				settings.jwtSecret ?? null,
				settings.pagespeedApiKey ?? null,
				settings.systemEmailHost ?? null,
				settings.systemEmailPort ?? null,
				settings.systemEmailAddress ?? null,
				settings.systemEmailPassword ?? null,
				settings.systemEmailUser ?? null,
				settings.systemEmailConnectionHost ?? null,
				settings.systemEmailTLSServername ?? null,
				settings.systemEmailSecure ?? false,
				settings.systemEmailPool ?? false,
				settings.systemEmailIgnoreTLS ?? false,
				settings.systemEmailRequireTLS ?? false,
				settings.systemEmailRejectUnauthorized ?? true,
				settings.showURL ?? false,
				settings.defaultUserAgent ?? null,
				settings.version ?? 1,
				settings.globalThresholds?.cpu ?? null,
				settings.globalThresholds?.memory ?? null,
				settings.globalThresholds?.disk ?? null,
				settings.globalThresholds?.temperature ?? null,
			]
		);
		const row = result.rows[0];
		if (!row) {
			throw new Error("Failed to create app settings");
		}
		return this.toEntity(row);
	};

	findSingleton = async (): Promise<Settings | null> => {
		const result = await this.pool.query<SettingsRow>(`SELECT ${COLUMNS} FROM app_settings LIMIT 1`);
		const row = result.rows[0];
		if (!row) {
			return null;
		}
		return this.toEntity(row);
	};

	update = async (settings: SettingsUpdate): Promise<Settings> => {
		const sets: string[] = [];
		const values: unknown[] = [];
		let paramIndex = 1;

		const fieldMap: [keyof SettingsUpdate, string][] = [
			["checkTTL", "check_ttl"],
			["language", "language"],
			["jwtSecret", "jwt_secret"],
			["pagespeedApiKey", "pagespeed_api_key"],
			["systemEmailHost", "system_email_host"],
			["systemEmailPort", "system_email_port"],
			["systemEmailAddress", "system_email_address"],
			["systemEmailPassword", "system_email_password"],
			["systemEmailUser", "system_email_user"],
			["systemEmailConnectionHost", "system_email_connection_host"],
			["systemEmailTLSServername", "system_email_tls_servername"],
			["systemEmailSecure", "system_email_secure"],
			["systemEmailPool", "system_email_pool"],
			["systemEmailIgnoreTLS", "system_email_ignore_tls"],
			["systemEmailRequireTLS", "system_email_require_tls"],
			["systemEmailRejectUnauthorized", "system_email_reject_unauthorized"],
			["showURL", "show_url"],
			["defaultUserAgent", "default_user_agent"],
			["version", "version"],
		];

		for (const [key, column] of fieldMap) {
			if (key in settings) {
				sets.push(`${column} = $${paramIndex++}`);
				// null means unset the field
				values.push(settings[key] ?? null);
			}
		}

		// Handle globalThresholds
		if ("globalThresholds" in settings) {
			const thresholds = settings.globalThresholds;
			if (thresholds === null || thresholds === undefined) {
				sets.push(`threshold_cpu_usage = NULL`);
				sets.push(`threshold_memory_usage = NULL`);
				sets.push(`threshold_disk_usage = NULL`);
				sets.push(`threshold_temperature = NULL`);
			} else {
				if ("cpu" in thresholds) {
					sets.push(`threshold_cpu_usage = $${paramIndex++}`);
					values.push(thresholds.cpu ?? null);
				}
				if ("memory" in thresholds) {
					sets.push(`threshold_memory_usage = $${paramIndex++}`);
					values.push(thresholds.memory ?? null);
				}
				if ("disk" in thresholds) {
					sets.push(`threshold_disk_usage = $${paramIndex++}`);
					values.push(thresholds.disk ?? null);
				}
				if ("temperature" in thresholds) {
					sets.push(`threshold_temperature = $${paramIndex++}`);
					values.push(thresholds.temperature ?? null);
				}
			}
		}

		if (sets.length === 0) {
			const existing = await this.findSingleton();
			if (!existing) {
				throw new Error("App settings not found");
			}
			return existing;
		}

		sets.push(`updated_at = NOW()`);

		// Upsert: update the single row, or insert if none exists
		const result = await this.pool.query<SettingsRow>(`UPDATE app_settings SET ${sets.join(", ")} RETURNING ${COLUMNS}`, values);
		const row = result.rows[0];
		if (!row) {
			// No row existed, create one
			return this.create(settings as Partial<Settings>);
		}
		return this.toEntity(row);
	};

	deleteLegacy = async (): Promise<boolean> => {
		// No legacy rows in TimescaleDB — singleton is enforced by trigger
		const result = await this.pool.query(`DELETE FROM app_settings WHERE version IS NULL`);
		return (result.rowCount ?? 0) > 0;
	};

	private toEntity = (row: SettingsRow): Settings => ({
		id: row.id,
		checkTTL: row.check_ttl,
		language: row.language ?? "",
		jwtSecret: row.jwt_secret ?? undefined,
		pagespeedApiKey: row.pagespeed_api_key ?? undefined,
		systemEmailHost: row.system_email_host ?? undefined,
		systemEmailPort: row.system_email_port ?? undefined,
		systemEmailAddress: row.system_email_address ?? undefined,
		systemEmailPassword: row.system_email_password ?? undefined,
		systemEmailUser: row.system_email_user ?? undefined,
		systemEmailConnectionHost: row.system_email_connection_host ?? undefined,
		systemEmailTLSServername: row.system_email_tls_servername ?? undefined,
		systemEmailSecure: row.system_email_secure ?? false,
		systemEmailPool: row.system_email_pool ?? false,
		systemEmailIgnoreTLS: row.system_email_ignore_tls ?? false,
		systemEmailRequireTLS: row.system_email_require_tls ?? false,
		systemEmailRejectUnauthorized: row.system_email_reject_unauthorized ?? true,
		showURL: row.show_url ?? false,
		defaultUserAgent: row.default_user_agent ?? undefined,
		singleton: true,
		version: Number(row.version ?? 1),
		globalThresholds:
			row.threshold_cpu_usage !== null ||
			row.threshold_memory_usage !== null ||
			row.threshold_disk_usage !== null ||
			row.threshold_temperature !== null
				? {
						cpu: row.threshold_cpu_usage ?? undefined,
						memory: row.threshold_memory_usage ?? undefined,
						disk: row.threshold_disk_usage ?? undefined,
						temperature: row.threshold_temperature ?? undefined,
					}
				: undefined,
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	});
}
