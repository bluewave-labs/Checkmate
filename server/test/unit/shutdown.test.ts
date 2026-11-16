import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { Server } from "http";
import { initShutdownListener } from "../../src/shutdown.ts";
import type { ILogger } from "../../src/utils/logger/logger.ts";
import type { IJobScheduler } from "../../src/worker/worker.interface.ts";
import type { IDb } from "../../src/db/db.interface.ts";
import type { Mongoose } from "mongoose";
import type { IConnectService } from "../../src/domain/connect/connect.service.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

type Handler = (...args: unknown[]) => void;

const setup = (opts?: { drain?: () => Promise<void>; withConnect?: boolean }) => {
	const handlers: Record<string, Handler> = {};
	jest.spyOn(process, "on").mockImplementation(((event: string, handler: Handler) => {
		handlers[event] = handler;
		return process;
	}) as typeof process.on);
	const exit = jest.spyOn(process, "exit").mockImplementation((() => undefined) as typeof process.exit);

	const logger = createMockLogger();
	const server = { close: jest.fn() } as unknown as Server;
	const worker = {
		drain: jest.fn(opts?.drain ?? (async () => {})),
		shutdown: jest.fn(async () => {}),
	} as unknown as jest.Mocked<IJobScheduler>;
	const db = { disconnect: jest.fn(async () => {}) } as unknown as jest.Mocked<IDb<Mongoose>>;
	const connectService = { stop: jest.fn() };

	initShutdownListener(server, {
		worker,
		db,
		logger: logger as unknown as ILogger,
		...(opts?.withConnect ? { connectService: connectService as unknown as IConnectService } : {}),
	});

	const emit = (event: string, ...args: unknown[]) => handlers[event]!(...args);
	return { emit, exit, logger, server, worker, db, connectService };
};

const never = () => new Promise<void>(() => {});
const flush = () => new Promise((resolve) => setImmediate(resolve));

afterEach(() => {
	jest.useRealTimers();
	jest.restoreAllMocks();
});

describe("initShutdownListener signals", () => {
	it.each([["SIGINT"], ["SIGTERM"], ["SIGUSR2"]])("shuts down gracefully on %s and exits 0", async (signal) => {
		const { emit, exit, server, worker, db } = setup();

		emit(signal);
		await flush();

		expect(server.close).toHaveBeenCalled();
		expect(worker.drain).toHaveBeenCalled();
		expect(worker.shutdown).toHaveBeenCalled();
		expect(db.disconnect).toHaveBeenCalled();
		expect(exit).toHaveBeenCalledWith(0);
	});

	it("stops the Connect tunnel before closing the HTTP server", async () => {
		const { emit, exit, server, connectService } = setup({ withConnect: true });

		emit("SIGTERM");
		await flush();

		expect(connectService.stop).toHaveBeenCalledTimes(1);
		const closeMock = server.close as unknown as jest.Mock;
		expect(connectService.stop.mock.invocationCallOrder[0]).toBeLessThan(closeMock.mock.invocationCallOrder[0]);
		expect(exit).toHaveBeenCalledWith(0);
	});

	it("shuts down without a Connect service, as worker-only processes do", async () => {
		const { emit, exit, connectService } = setup();

		emit("SIGTERM");
		await flush();

		expect(connectService.stop).not.toHaveBeenCalled();
		expect(exit).toHaveBeenCalledWith(0);
	});

	it("exits 1 immediately on a second signal while shutdown is still draining", () => {
		const { emit, exit } = setup({ drain: never });

		emit("SIGINT");
		expect(exit).not.toHaveBeenCalled();

		emit("SIGINT");
		expect(exit).toHaveBeenCalledWith(1);
	});

	it("exits 1 when the graceful shutdown fails", async () => {
		const { emit, exit, logger } = setup({ drain: async () => Promise.reject(new Error("drain failed")) });

		emit("SIGTERM");
		await flush();

		expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ err: expect.any(Error) }), "Graceful shutdown failed");
		expect(exit).toHaveBeenCalledWith(1);
	});
});

describe("initShutdownListener deadline", () => {
	it("exits 1 when shutdown hangs past the deadline", () => {
		jest.useFakeTimers();
		const { emit, exit } = setup({ drain: never });

		emit("SIGINT");
		jest.advanceTimersByTime(29_999);
		expect(exit).not.toHaveBeenCalled();

		jest.advanceTimersByTime(1);
		expect(exit).toHaveBeenCalledWith(1);
	});

	it("does not hold the process open once shutdown is done", () => {
		const unref = jest.fn();
		jest.spyOn(global, "setTimeout").mockReturnValue({ unref } as unknown as NodeJS.Timeout);
		const { emit } = setup({ drain: never });

		emit("SIGINT");

		expect(unref).toHaveBeenCalled();
	});
});

describe("initShutdownListener error handlers", () => {
	it("logs an uncaught exception once and starts shutdown", () => {
		const { emit, logger, worker } = setup({ drain: never });

		emit("uncaughtException", new Error("boom"));

		expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ err: expect.any(Error) }), "Uncaught exception");
		expect(worker.drain).toHaveBeenCalledTimes(1);
	});

	it("does not log errors raised after shutdown has started", () => {
		const { emit, logger } = setup({ drain: never });

		emit("SIGINT");
		emit("uncaughtException", new Error("write EPIPE"));
		emit("unhandledRejection", new Error("late rejection"));

		expect(logger.error).not.toHaveBeenCalled();
	});

	it("logs an unhandled rejection and exits 1 after the deadline if shutdown hangs", () => {
		jest.useFakeTimers();
		const { emit, logger, exit } = setup({ drain: never });

		emit("unhandledRejection", new Error("nope"));
		jest.advanceTimersByTime(30_000);

		expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ err: expect.any(Error) }), "Unhandled promise rejection");
		expect(exit).toHaveBeenCalledWith(1);
	});
});
