import type { Pool } from "pg";
import type { IStatusPagesRepository } from "./IStatusPagesRepository.js";
import type { StatusPage, StatusPageType } from "@/types/statusPage.js";
import { AppError } from "@/utils/AppError.js";

const parsePostgresArray = (value: unknown): StatusPageType[] => {
	if (typeof value !== "string") return [];
	const inner = value.replace(/^\{|\}$/g, "");
	if (inner === "") return [];
	return inner.split(",") as StatusPageType[];
};

interface StatusPageRow {
	id: string;
	user_id: string;
	team_id: string;
	types: StatusPageType[];
	company_name: string;
	url: string;
	timezone: string | null;
	color: string;
	logo_data: Buffer | null;
	logo_content_type: string | null;
	is_published: boolean;
	show_charts: boolean;
	show_uptime_percentage: boolean;
	show_admin_login_link: boolean;
	show_infrastructure: boolean;
	custom_css: string | null;
	created_at: Date;
	updated_at: Date;
}

const COLUMNS = `id, user_id, team_id, types, company_name, url, timezone, color,
	logo_data, logo_content_type, is_published, show_charts, show_uptime_percentage,
	show_admin_login_link, show_infrastructure, custom_css, created_at, updated_at`;

export class TimescaleStatusPagesRepository implements IStatusPagesRepository {
	constructor(private pool: Pool) {}

	create = async (userId: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage> => {
		const result = await this.pool.query<StatusPageRow>(
			`INSERT INTO status_pages (user_id, team_id, types, company_name, url, timezone, color,
				logo_data, logo_content_type, is_published, show_charts, show_uptime_percentage,
				show_admin_login_link, show_infrastructure, custom_css)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
			 RETURNING ${COLUMNS}`,
			[
				userId,
				teamId,
				data.type ?? ["uptime"],
				data.companyName ?? "",
				data.url ?? "",
				data.timezone ?? null,
				data.color ?? "#4169E1",
				image?.buffer ?? null,
				image?.mimetype ?? null,
				data.isPublished ?? false,
				data.showCharts ?? false,
				data.showUptimePercentage ?? false,
				data.showAdminLoginLink ?? false,
				data.showInfrastructure ?? false,
				data.customCSS ?? null,
			]
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Failed to create status page", status: 500 });
		}

		// Insert monitor associations
		if (data.monitors?.length) {
			for (const [i, monitorId] of data.monitors.entries()) {
				await this.pool.query(
					`INSERT INTO status_page_monitors (status_page_id, monitor_id, sort_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
					[row.id, monitorId, i]
				);
			}
		}
		if (data.subMonitors?.length) {
			for (const [i, monitorId] of data.subMonitors.entries()) {
				await this.pool.query(
					`INSERT INTO status_page_sub_monitors (status_page_id, monitor_id, sort_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
					[row.id, monitorId, i]
				);
			}
		}

		return this.loadEntity(row);
	};

	findByUrl = async (url: string): Promise<StatusPage> => {
		const result = await this.pool.query<StatusPageRow>(`SELECT ${COLUMNS} FROM status_pages WHERE url = $1`, [url]);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Status page not found", status: 404 });
		}
		return this.loadEntity(row);
	};

	findByTeamId = async (teamId: string): Promise<StatusPage[]> => {
		const result = await this.pool.query<StatusPageRow>(`SELECT ${COLUMNS} FROM status_pages WHERE team_id = $1`, [teamId]);
		const pages: StatusPage[] = [];
		for (const row of result.rows) {
			pages.push(await this.loadEntity(row));
		}
		return pages;
	};

	updateById = async (
		id: string,
		teamId: string,
		image: Express.Multer.File | undefined,
		patch: Partial<StatusPage> & { removeLogo?: string }
	): Promise<StatusPage> => {
		const sets: string[] = [];
		const values: unknown[] = [];
		let paramIndex = 1;

		const fieldMap: [keyof StatusPage, string][] = [
			["type", "types"],
			["companyName", "company_name"],
			["url", "url"],
			["timezone", "timezone"],
			["color", "color"],
			["isPublished", "is_published"],
			["showCharts", "show_charts"],
			["showUptimePercentage", "show_uptime_percentage"],
			["showAdminLoginLink", "show_admin_login_link"],
			["showInfrastructure", "show_infrastructure"],
			["customCSS", "custom_css"],
		];

		for (const [key, column] of fieldMap) {
			if (patch[key] !== undefined) {
				sets.push(`${column} = $${paramIndex++}`);
				values.push(patch[key]);
			}
		}

		if (image) {
			sets.push(`logo_data = $${paramIndex++}`);
			values.push(image.buffer);
			sets.push(`logo_content_type = $${paramIndex++}`);
			values.push(image.mimetype);
		} else if (patch.removeLogo === "true") {
			sets.push(`logo_data = NULL`);
			sets.push(`logo_content_type = NULL`);
		}

		if (sets.length > 0) {
			sets.push(`updated_at = NOW()`);
			values.push(id, teamId);

			const result = await this.pool.query<StatusPageRow>(
				`UPDATE status_pages SET ${sets.join(", ")} WHERE id = $${paramIndex++} AND team_id = $${paramIndex}
				 RETURNING ${COLUMNS}`,
				values
			);
			const row = result.rows[0];
			if (!row) {
				throw new AppError({ message: "Status page not found", status: 404 });
			}
		}

		// Update monitor associations if provided
		if (patch.monitors !== undefined) {
			await this.pool.query(`DELETE FROM status_page_monitors WHERE status_page_id = $1`, [id]);
			for (const [i, monitorId] of patch.monitors.entries()) {
				await this.pool.query(
					`INSERT INTO status_page_monitors (status_page_id, monitor_id, sort_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
					[id, monitorId, i]
				);
			}
		}
		if (patch.subMonitors !== undefined) {
			await this.pool.query(`DELETE FROM status_page_sub_monitors WHERE status_page_id = $1`, [id]);
			for (const [i, monitorId] of patch.subMonitors.entries()) {
				await this.pool.query(
					`INSERT INTO status_page_sub_monitors (status_page_id, monitor_id, sort_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
					[id, monitorId, i]
				);
			}
		}

		// Re-fetch to return full entity
		const freshResult = await this.pool.query<StatusPageRow>(`SELECT ${COLUMNS} FROM status_pages WHERE id = $1 AND team_id = $2`, [id, teamId]);
		const freshRow = freshResult.rows[0];
		if (!freshRow) {
			throw new AppError({ message: "Status page not found", status: 404 });
		}
		return this.loadEntity(freshRow);
	};

	deleteById = async (id: string, teamId: string): Promise<StatusPage> => {
		// Load entity before delete (join tables cascade)
		const existing = await this.pool.query<StatusPageRow>(`SELECT ${COLUMNS} FROM status_pages WHERE id = $1 AND team_id = $2`, [id, teamId]);
		const row = existing.rows[0];
		if (!row) {
			throw new AppError({ message: "Status page not found", status: 404 });
		}
		const entity = await this.loadEntity(row);

		await this.pool.query(`DELETE FROM status_pages WHERE id = $1 AND team_id = $2`, [id, teamId]);
		return entity;
	};

	removeMonitorFromStatusPages = async (monitorId: string): Promise<number> => {
		// Return count of distinct status pages affected, matching Mongo's modifiedCount
		const result = await this.pool.query(
			`SELECT COUNT(DISTINCT status_page_id)::int AS count FROM (
				SELECT status_page_id FROM status_page_monitors WHERE monitor_id = $1
				UNION
				SELECT status_page_id FROM status_page_sub_monitors WHERE monitor_id = $1
			 ) affected`,
			[monitorId]
		);
		const affectedCount = result.rows[0]?.count ?? 0;

		await this.pool.query(`DELETE FROM status_page_monitors WHERE monitor_id = $1`, [monitorId]);
		await this.pool.query(`DELETE FROM status_page_sub_monitors WHERE monitor_id = $1`, [monitorId]);

		return affectedCount;
	};

	private loadEntity = async (row: StatusPageRow): Promise<StatusPage> => {
		const [monitorsResult, subMonitorsResult] = await Promise.all([
			this.pool.query(`SELECT monitor_id FROM status_page_monitors WHERE status_page_id = $1 ORDER BY sort_order`, [row.id]),
			this.pool.query(`SELECT monitor_id FROM status_page_sub_monitors WHERE status_page_id = $1 ORDER BY sort_order`, [row.id]),
		]);

		return {
			id: row.id,
			userId: row.user_id,
			teamId: row.team_id,
			type: Array.isArray(row.types) ? row.types : parsePostgresArray(row.types),
			companyName: row.company_name,
			url: row.url,
			timezone: row.timezone ?? undefined,
			color: row.color,
			monitors: monitorsResult.rows.map((r) => r.monitor_id),
			subMonitors: subMonitorsResult.rows.map((r) => r.monitor_id),
			originalMonitors: [],
			logo: row.logo_data
				? {
						data: row.logo_data.toString("base64"),
						contentType: row.logo_content_type ?? "",
					}
				: undefined,
			isPublished: row.is_published,
			showCharts: row.show_charts,
			showUptimePercentage: row.show_uptime_percentage,
			showAdminLoginLink: row.show_admin_login_link,
			showInfrastructure: row.show_infrastructure,
			customCSS: row.custom_css ?? "",
			createdAt: row.created_at.toISOString(),
			updatedAt: row.updated_at.toISOString(),
		};
	};
}
