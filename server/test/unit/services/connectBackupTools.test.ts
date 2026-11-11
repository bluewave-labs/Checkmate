import { describe, expect, it, jest } from "@jest/globals";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import type { execFile, spawn } from "node:child_process";
import { ConnectBackupTools } from "../../../src/domain/connect/connect.backup-tools.ts";
import type { ISettingsService } from "../../../src/domain/app-settings/app-settings.service.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

const DB_URI = "mongodb://user:secret@db:27017/uptime_db";

const fakeChild = () =>
	Object.assign(new EventEmitter(), {
		stdout: new PassThrough(),
		stderr: new PassThrough(),
	});

const setup = (opts: { missing?: string[] } = {}) => {
	const logger = createMockLogger();
	const child = fakeChild();
	const spawnProcess = jest.fn(() => child);
	const execFileProcess = jest.fn((bin: string, _args: string[], _options: unknown, callback: (error: Error | null) => void) => {
		callback(opts.missing?.includes(bin) ? new Error(`spawn ${bin} ENOENT`) : null);
	});
	const settings = {
		connectMongodumpBin: "mongodump",
		connectMongorestoreBin: "mongorestore",
		dbConnectionString: DB_URI,
	};
	const settingsService = {
		getSettings: () => settings,
	} as unknown as ISettingsService;
	const tools = new ConnectBackupTools(
		spawnProcess as unknown as typeof spawn,
		execFileProcess as unknown as typeof execFile,
		settingsService,
		logger as any
	);
	return { tools, child, spawnProcess, execFileProcess, settings, logger };
};

describe("ConnectBackupTools.dump", () => {
	it("runs mongodump with the config file, never the URI on the command line", () => {
		const { tools, spawnProcess } = setup();

		tools.dump("/tmp/x/mongo.yaml", "uptime_db", "full");

		const [bin, args, options] = spawnProcess.mock.calls[0] as unknown as [string, string[], { stdio: string[] }];
		expect(bin).toBe("mongodump");
		expect(args).toEqual(["--config=/tmp/x/mongo.yaml", "--archive", "--gzip", "--db=uptime_db", "--excludeCollection=connect_state"]);
		expect(args.join(" ")).not.toContain("mongodb://");
		expect(options.stdio).toEqual(["ignore", "pipe", "pipe"]);
	});

	it("excludes operational data from config backups only", () => {
		const full = setup();
		const config = setup();

		full.tools.dump("c", "d", "full");
		config.tools.dump("c", "d", "config");

		const fullArgs = (full.spawnProcess.mock.calls[0] as unknown as [string, string[]])[1];
		const configArgs = (config.spawnProcess.mock.calls[0] as unknown as [string, string[]])[1];
		expect(fullArgs).not.toContain("--excludeCollection=checks");
		expect(configArgs).toEqual(
			expect.arrayContaining([
				"--excludeCollection=connect_state",
				"--excludeCollection=checks",
				"--excludeCollection=monitorstats",
				"--excludeCollection=geochecks",
				"--excludeCollection=dockerlogs",
				"--excludeCollection=dlqitems",
				"--excludeCollection=jobs",
			])
		);
	});

	it("uses the configured mongodump path", () => {
		const { tools, spawnProcess, settings } = setup();
		settings.connectMongodumpBin = "/opt/tools/mongodump";

		tools.dump("c", "d", "full");

		expect((spawnProcess.mock.calls[0] as unknown as [string])[0]).toBe("/opt/tools/mongodump");
	});

	it("resolves when mongodump exits 0", async () => {
		const { tools, child } = setup();
		const dump = tools.dump("c", "d", "full");

		child.emit("close", 0);

		await expect(dump.exited).resolves.toBeUndefined();
		expect(dump.stdout).toBe(child.stdout);
	});

	it("rejects with the end of stderr on a non-zero exit", async () => {
		const { tools, child } = setup();
		const dump = tools.dump("c", "d", "full");

		child.stderr.write(`${"x".repeat(3_000)}auth failed`);
		await new Promise((resolve) => setImmediate(resolve));
		child.emit("close", 1);

		const error = await dump.exited.catch((caught: unknown) => caught);
		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).toMatch(/^mongodump exited 1: x+auth failed$/);
		expect((error as Error).message.length).toBeLessThanOrEqual("mongodump exited 1: ".length + 2_000);
	});

	it("rejects when mongodump can't be started", async () => {
		const { tools, child } = setup();
		const dump = tools.dump("c", "d", "full");

		child.emit("error", new Error("spawn mongodump ENOENT"));

		await expect(dump.exited).rejects.toThrow("mongodump not available: spawn mongodump ENOENT");
	});
});

describe("ConnectBackupTools.withWorkDir", () => {
	it("writes the URI to a private config file and removes the directory afterwards", async () => {
		const { tools } = setup();
		let seenDir = "";

		await tools.withWorkDir(async (dir, configFile) => {
			seenDir = dir;
			expect(await fs.promises.readFile(configFile, "utf8")).toBe(`uri: ${JSON.stringify(DB_URI)}\n`);
			expect((await fs.promises.stat(configFile)).mode & 0o777).toBe(0o600);
		});

		expect(fs.existsSync(seenDir)).toBe(false);
	});

	it("removes the directory when the work fails, and rethrows", async () => {
		const { tools } = setup();
		let seenDir = "";

		await expect(
			tools.withWorkDir(async (dir) => {
				seenDir = dir;
				throw new Error("work failed");
			})
		).rejects.toThrow("work failed");
		expect(fs.existsSync(seenDir)).toBe(false);
	});

	it("returns what the work returns", async () => {
		const { tools } = setup();

		await expect(tools.withWorkDir(async () => 42)).resolves.toBe(42);
	});
});

describe("ConnectBackupTools.withWorkDir stale directories", () => {
	const DAY_MS = 24 * 60 * 60 * 1000;

	const makeDir = async (name: string, ageMs: number) => {
		const dir = path.join(os.tmpdir(), name);
		await fs.promises.mkdir(dir, { recursive: true });
		await fs.promises.writeFile(path.join(dir, "mongo.yaml"), "uri: x\n");
		const when = new Date(Date.now() - ageMs);
		await fs.promises.utimes(dir, when, when);
		return dir;
	};

	it("removes work directories older than a day before starting", async () => {
		const { tools, logger } = setup();
		const stale = await makeDir(`checkmate-connect-test-stale-${process.pid}`, DAY_MS + 60_000);

		await tools.withWorkDir(async () => undefined);

		expect(fs.existsSync(stale)).toBe(false);
		expect(logger.info).toHaveBeenCalledWith({ dir: stale }, "Removed a Connect work directory left by an interrupted backup");
	});

	it("keeps recent work directories, which may belong to a backup still running", async () => {
		const { tools } = setup();
		const recent = await makeDir(`checkmate-connect-test-recent-${process.pid}`, 60 * 60 * 1000);

		try {
			await tools.withWorkDir(async () => undefined);

			expect(fs.existsSync(recent)).toBe(true);
		} finally {
			await fs.promises.rm(recent, { recursive: true, force: true });
		}
	});

	it("leaves directories that aren't Connect work directories alone", async () => {
		const { tools } = setup();
		const other = await makeDir(`not-checkmate-${process.pid}`, DAY_MS * 2);

		try {
			await tools.withWorkDir(async () => undefined);

			expect(fs.existsSync(other)).toBe(true);
		} finally {
			await fs.promises.rm(other, { recursive: true, force: true });
		}
	});

	it("still runs the work when the sweep fails", async () => {
		const { tools, logger } = setup();
		const readdir = jest.spyOn(fs.promises, "readdir").mockRejectedValueOnce(new Error("EACCES"));

		try {
			await expect(tools.withWorkDir(async () => 42)).resolves.toBe(42);
			expect(logger.warn).toHaveBeenCalledWith({ err: expect.any(Error) }, "Could not remove stale Connect work directories");
		} finally {
			readdir.mockRestore();
		}
	});
});

describe("ConnectBackupTools.checkTools", () => {
	it("reports nothing missing when both tools run", async () => {
		const { tools, logger, execFileProcess } = setup();

		await expect(tools.checkTools()).resolves.toEqual([]);
		expect(logger.warn).not.toHaveBeenCalled();
		expect(execFileProcess).toHaveBeenCalledWith("mongodump", ["--version"], { timeout: 10_000 }, expect.any(Function));
	});

	it("names each tool that can't run", async () => {
		const restore = setup({ missing: ["mongorestore"] });
		const both = setup({ missing: ["mongodump", "mongorestore"] });

		await expect(restore.tools.checkTools()).resolves.toEqual(["mongorestore"]);
		await expect(both.tools.checkTools()).resolves.toEqual(["mongodump", "mongorestore"]);
	});

	it("warns once per change in the missing set and clears after install", async () => {
		const missing = ["mongodump"];
		const { tools, logger } = setup({ missing });

		await tools.checkTools();
		await tools.checkTools();
		expect(logger.warn).toHaveBeenCalledTimes(1);
		expect(logger.warn).toHaveBeenCalledWith({ missing: ["mongodump"] }, "Connect cloud backups are unavailable until these tools are installed");

		missing.splice(0);
		await expect(tools.checkTools()).resolves.toEqual([]);
		expect(logger.warn).toHaveBeenCalledTimes(1);
	});

	it("counts a tool as missing when execFile throws", async () => {
		const { tools, execFileProcess } = setup();
		execFileProcess.mockImplementation(() => {
			throw new Error("bad path");
		});

		await expect(tools.checkTools()).resolves.toEqual(["mongodump", "mongorestore"]);
	});
});
