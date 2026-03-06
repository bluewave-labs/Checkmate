export interface IDb {
	connect(): Promise<void>;
	disconnect(): Promise<void>;
}
