import { Pool } from "pg";

export interface IDb {
	connect(): Promise<void>;
	disconnect(): Promise<void>;
	getPool(): Pool | null;
}
