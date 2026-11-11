import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { execFile, spawn } from "node:child_process";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { CONNECT_STATE_COLLECTION } from "@/domain/connect/connect.type.js";
import {
	ConnectBackupToolNames,
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
const CONFIG_EXCLUDED_COLLECTIONS = ["checks", "monitorstats", "geochecks", "dockerlogs", "dlqitems", "jobs"] as const;

export interface IConnectBackupTools {
	checkTools(): Promise<ConnectBackupToolName[]>;
	withWorkDir<T>(work: (dir: string, configFile: string) => Promise<T>): Promise<T>;
	dump(configFile: string, dbName: string, kind: ConnectBackupKind): ConnectDump;
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
		const excluded = [CONNECT_STATE_COLLECTION, ...(kind === "config" ? CONFIG_EXCLUDED_COLLECTIONS : [])];
		return [`--config=${configFile}`, "--archive", "--gzip", `--db=${dbName}`, ...excluded.map((name) => `--excludeCollection=${name}`)];
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

	withWorkDir = async <T>(work: (dir: string, configFile: string) => Promise<T>): Promise<T> => {
		await this.removeStaleWorkDirs();
		const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), WORK_DIR_PREFIX));
		try {
			const configFile = path.join(dir, "mongo.yaml");
			const { dbConnectionString } = this.settingsService.getSettings();
			await fs.promises.writeFile(configFile, `uri: ${JSON.stringify(dbConnectionString)}\n`, { mode: 0o600 });
			return await work(dir, configFile);
		} finally {
			await fs.promises.rm(dir, { recursive: true, force: true });
		}
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
}
