import { describe, expect, it, jest } from "@jest/globals";
import { ConnectToolsService } from "../../../src/domain/connect/connect-tools.service.ts";
import type { ConnectBackupToolName } from "../../../src/domain/connect/connect-backup.type.ts";
import type { QueueWorker } from "../../../src/domain/queue-workers/queue-worker.type.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

const worker = (overrides: Partial<QueueWorker> = {}): QueueWorker => ({
	workerId: "other",
	mode: "worker",
	processesJobs: true,
	lastSeenAt: Date.now(),
	connectTools: { missing: [], checkedAt: 1 },
	...overrides,
});

const setup = (
	opts: {
		missing?: ConnectBackupToolName[][];
		workers?: QueueWorker[];
		setConnectTools?: jest.Mock<any>;
	} = {}
) => {
	const logger = createMockLogger();
	const results = [...(opts.missing ?? [[]])];
	const tools = {
		checkTools: jest.fn<any>(async () => results.shift() ?? []),
		withWorkDir: jest.fn<any>(),
		dump: jest.fn<any>(),
	};
	const queueWorkersRepository = {
		setConnectTools: opts.setConnectTools ?? jest.fn<any>().mockResolvedValue(undefined),
		findRecent: jest.fn<any>().mockResolvedValue(opts.workers ?? []),
	};
	const reporter = new ConnectToolsService(tools, queueWorkersRepository as any, "self", logger as any);
	return { reporter, tools, queueWorkersRepository, logger };
};

describe("ConnectToolsService.report", () => {
	it("publishes the check on this worker's own row", async () => {
		const { reporter, queueWorkersRepository } = setup({
			missing: [["mongodump"]],
		});

		await reporter.report();

		expect(queueWorkersRepository.setConnectTools).toHaveBeenCalledWith("self", { missing: ["mongodump"], checkedAt: expect.any(Number) });
	});

	it("re-checks while something is missing and clears after install", async () => {
		const { reporter, tools, queueWorkersRepository } = setup({
			missing: [["mongodump"], []],
		});

		await reporter.report();
		await reporter.report();

		expect(tools.checkTools).toHaveBeenCalledTimes(2);
		expect(queueWorkersRepository.setConnectTools).toHaveBeenLastCalledWith("self", { missing: [], checkedAt: expect.any(Number) });
	});

	it("stops re-checking once nothing is missing but keeps publishing", async () => {
		const { reporter, tools, queueWorkersRepository } = setup({
			missing: [[]],
		});

		await reporter.report();
		await reporter.report();
		await reporter.report();

		expect(tools.checkTools).toHaveBeenCalledTimes(1);
		expect(queueWorkersRepository.setConnectTools).toHaveBeenCalledTimes(3);
	});

	it("never throws when the check fails", async () => {
		const { reporter, tools, logger } = setup();
		tools.checkTools.mockRejectedValue(new Error("boom"));

		await expect(reporter.report()).resolves.toBeUndefined();
		expect(logger.warn).toHaveBeenCalledWith({ err: expect.any(Error) }, "Could not publish the Connect backup tools check");
	});

	it("never throws when publishing fails, and publishes again next time", async () => {
		const setConnectTools = jest.fn<any>().mockRejectedValueOnce(new Error("db down")).mockResolvedValue(undefined);
		const { reporter } = setup({ setConnectTools });

		await expect(reporter.report()).resolves.toBeUndefined();
		await reporter.report();

		expect(setConnectTools).toHaveBeenCalledTimes(2);
	});
});

describe("ConnectToolsService.hasTool", () => {
	it("assumes a tool is there before the first check", () => {
		const { reporter } = setup();

		expect(reporter.hasTool("mongodump")).toBe(true);
	});

	it("reflects the last check", async () => {
		const { reporter } = setup({ missing: [["mongodump"]] });

		await reporter.report();

		expect(reporter.hasTool("mongodump")).toBe(false);
		expect(reporter.hasTool("mongorestore")).toBe(true);
	});
});

describe("ConnectToolsService.isAvailableOnAnotherWorker", () => {
	it("is true when another live job-processing worker has the tool", async () => {
		const { reporter } = setup({ workers: [worker()] });

		await expect(reporter.isAvailableOnAnotherWorker("mongodump")).resolves.toBe(true);
	});

	it.each([
		["only this worker has reported", [worker({ workerId: "self" })]],
		["the other worker is missing it too", [worker({ connectTools: { missing: ["mongodump"], checkedAt: 1 } })]],
		["the other worker doesn't process jobs", [worker({ processesJobs: false })]],
		["the other worker never reported", [worker({ connectTools: undefined })]],
		["there are no other workers", []],
	])("is false when %s", async (_label, workers) => {
		const { reporter } = setup({ workers });

		await expect(reporter.isAvailableOnAnotherWorker("mongodump")).resolves.toBe(false);
	});

	it("reads only live workers", async () => {
		const { reporter, queueWorkersRepository } = setup();

		await reporter.isAvailableOnAnotherWorker("mongodump");

		expect(queueWorkersRepository.findRecent).toHaveBeenCalledWith(180_000);
	});
});
