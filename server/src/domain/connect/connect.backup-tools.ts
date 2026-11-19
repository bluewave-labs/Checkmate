import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { execFile, spawn } from "node:child_process";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import {
	ConnectBackupCollections,
	ConnectBackupToolNames,
	ConnectConfigExcludedCollections,
	ConnectRuntimeCollections,
	type ConnectBackupKind,
	type ConnectBackupToolName,
	type ConnectDump,
} from "@/domain/connect/connect-backup.type.js";
import type { ILogger } from "@/utils/logger/logger.js";

const SERVICE_NAME = "ConnectBackupTools";
const TOOL_CHECK_TIMEOUT_MS = 10_000;
const STDERR_TAIL_CHARS = 2_000;
const WORK_DIR_PREFIX = "checkmate-connect-";
const STALE_WORK_DIR_MS = 24 * 60 * 60 * 1000;
const RESTORED_NOTHING = /(^|\s)0 document\(s\) restored successfully/;

export interface IConnectBackupTools {
	checkTools(): Promise<ConnectBackupToolName[]>;
	withWorkDir<T>(work: (dir: string, configFile: string) => Promise<T>): Promise<T>;
	dump(configFile: string, dbName: string, kind: ConnectBackupKind): ConnectDump;
	withRestoreWorkDir<T>(work: (dir: string, configFile: string) => Promise<T>): Promise<T>;
	restore(configFile: string, archive: string, dbName: string): Promise<void>;
}

export class ConnectBackupTools implements IConnectBackupTools {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;
	private lastMissing: ConnectBackupToolName[] = [];

	constructor(
		private spawnProcess: typeof spawn,
		private execFileProcess: typeof execFile,
		private settingsService: ISettingsService,
		logger: ILogger
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
	}

	private toolBin = (tool: ConnectBackupToolName): string => {
		const { connectMongodumpBin, connectMongorestoreBin } = this.settingsService.getSettings();
		return tool === "mongodump" ? connectMongodumpBin : connectMongorestoreBin;
	};

	private isRunnable = (bin: string): Promise<boolean> =>
		new Promise((resolve) => {
			try {
				this.execFileProcess(bin, ["--version"], { timeout: TOOL_CHECK_TIMEOUT_MS }, (error) => resolve(error === null));
			} catch {
				resolve(false);
			}
		});

	private dumpArgs = (configFile: string, dbName: string, kind: ConnectBackupKind): string[] => {
		const excluded = [...ConnectRuntimeCollections, ...(kind === "config" ? ConnectConfigExcludedCollections : [])];
		return [`--config=${configFile}`, "--archive", "--gzip", `--db=${dbName}`, ...excluded.map((name) => `--excludeCollection=${name}`)];
	};

	private restoreArgs = (configFile: string, archive: string, dbName: string): string[] => {
		return [
			`--config=${configFile}`,
			`--archive=${archive}`,
			"--gzip",
			"--drop",
			...ConnectBackupCollections.map((name) => `--nsInclude=*.${name}`),
			"--nsFrom=$db$.$coll$",
			`--nsTo=${dbName}.$coll$`,
		];
	};

	private restoreConnectionUri = (mongoUrl: string): string => {
		const match = mongoUrl.match(/^(mongodb(?:\+srv)?:\/\/[^/?]*)(?:\/([^?]*))?(?:\?(.*))?$/);
		if (!match) return mongoUrl;
		const [, base, database, query] = match;
		if (!base || !database) return mongoUrl;
		const params = query ? query.split("&") : [];
		const hasAuthSource = params.some((param) => param.toLowerCase().startsWith("authsource="));
		if (base.includes("@") && !hasAuthSource) params.push(`authSource=${database}`);
		return params.length > 0 ? `${base}/?${params.join("&")}` : `${base}/`;
	};

	checkTools = async (): Promise<ConnectBackupToolName[]> => {
		const results = await Promise.all(
			ConnectBackupToolNames.map(async (tool) => ({
				tool,
				runnable: await this.isRunnable(this.toolBin(tool)),
			}))
		);
		const missing = results.filter((result) => !result.runnable).map((result) => result.tool);
		if (missing.length > 0 && missing.join() !== this.lastMissing.join()) {
			this.logger.warn({ missing }, "Connect cloud backups are unavailable until these tools are installed");
		}
		this.lastMissing = missing;
		return missing;
	};

	private removeStaleWorkDirs = async (): Promise<void> => {
		try {
			const cutoff = Date.now() - STALE_WORK_DIR_MS;
			const entries = await fs.promises.readdir(os.tmpdir(), { withFileTypes: true });
			for (const entry of entries) {
				if (!entry.isDirectory() || !entry.name.startsWith(WORK_DIR_PREFIX)) continue;
				const dir = path.join(os.tmpdir(), entry.name);
				const { mtimeMs } = await fs.promises.stat(dir);
				if (mtimeMs > cutoff) continue;
				await fs.promises.rm(dir, { recursive: true, force: true });
				this.logger.info({ dir }, "Removed a Connect work directory left by an interrupted backup");
			}
		} catch (error: unknown) {
			this.logger.warn({ err: error }, "Could not remove stale Connect work directories");
		}
	};

	private createWorkDir = async <T>(uri: string, work: (dir: string, configFile: string) => Promise<T>): Promise<T> => {
		await this.removeStaleWorkDirs();
		const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), WORK_DIR_PREFIX));
		try {
			const configFile = path.join(dir, "mongo.yaml");
			await fs.promises.writeFile(configFile, `uri: ${JSON.stringify(uri)}\n`, { mode: 0o600 });
			return await work(dir, configFile);
		} finally {
			await fs.promises.rm(dir, { recursive: true, force: true });
		}
	};

	withWorkDir = async <T>(work: (dir: string, configFile: string) => Promise<T>): Promise<T> => {
		return this.createWorkDir(this.settingsService.getSettings().dbConnectionString, work);
	};

	withRestoreWorkDir = async <T>(work: (dir: string, configFile: string) => Promise<T>): Promise<T> => {
		return this.createWorkDir(this.restoreConnectionUri(this.settingsService.getSettings().dbConnectionString), work);
	};

	dump = (configFile: string, dbName: string, kind: ConnectBackupKind): ConnectDump => {
		const child = this.spawnProcess(this.toolBin("mongodump"), this.dumpArgs(configFile, dbName, kind), { stdio: ["ignore", "pipe", "pipe"] });
		let stderr = "";
		child.stderr.on("data", (chunk: Buffer) => {
			stderr = (stderr + chunk.toString()).slice(-STDERR_TAIL_CHARS);
		});
		const exited = new Promise<void>((resolve, reject) => {
			child.on("error", (error) => reject(new Error(`mongodump not available: ${error.message}`)));
			child.on("close", (code) => {
				if (code === 0) {
					resolve();
					return;
				}
				reject(new Error(`mongodump exited ${code}: ${stderr.trim()}`));
			});
		});
		return { stdout: child.stdout, exited };
	};

	restore = (configFile: string, archive: string, dbName: string): Promise<void> => {
		return new Promise((resolve, reject) => {
			const child = this.spawnProcess(this.toolBin("mongorestore"), this.restoreArgs(configFile, archive, dbName), {
				stdio: ["ignore", "ignore", "pipe"],
			});
			let stderr = "";
			child.stderr.on("data", (chunk: Buffer) => {
				stderr = (stderr + chunk.toString()).slice(-STDERR_TAIL_CHARS);
			});
			child.on("error", (error) => reject(new Error(`mongorestore not available: ${error.message}`)));
			child.on("close", (code) => {
				if (code !== 0) {
					reject(new Error(`mongorestore exited ${code}: ${stderr.trim()}`));
					return;
				}
				if (RESTORED_NOTHING.test(stderr)) {
					reject(new Error("restore wrote no data"));
					return;
				}
				resolve();
			});
		});
	};
}
