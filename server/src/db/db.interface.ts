export interface IDb<TConnection = unknown> {
	connect(): Promise<void>;
	disconnect(): Promise<void>;
	getConnection(): Promise<TConnection>;
}
