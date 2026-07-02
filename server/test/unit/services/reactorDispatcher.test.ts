import { describe, expect, it, jest } from "@jest/globals";
import { ReactorDispatcher } from "../../../src/worker/reactors/reactor.dispatcher.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

const evaluation = { monitor: { id: "m1" } } as any;

const makeReactor = (name: string, blocking: boolean, impl?: () => Promise<void>) => ({
	name,
	blocking,
	react: jest.fn(impl ?? (() => Promise.resolve())),
});

describe("ReactorDispatcher", () => {
	it("runs every reactor with the evaluation", async () => {
		const a = makeReactor("a", true);
		const b = makeReactor("b", false);
		const dispatcher = new ReactorDispatcher(createMockLogger() as any, [a, b] as any);

		await dispatcher.dispatch(evaluation);

		expect(a.react).toHaveBeenCalledWith(evaluation);
		expect(b.react).toHaveBeenCalledWith(evaluation);
	});

	it("awaits blocking reactors before resolving", async () => {
		let done = false;
		const blocking = makeReactor(
			"incident",
			true,
			() =>
				new Promise((r) =>
					setTimeout(() => {
						done = true;
						r();
					}, 10)
				)
		);
		const dispatcher = new ReactorDispatcher(createMockLogger() as any, [blocking] as any);

		await dispatcher.dispatch(evaluation);

		expect(done).toBe(true);
	});

	it("does not await non-blocking reactors", async () => {
		let done = false;
		const nonBlocking = makeReactor(
			"notification",
			false,
			() =>
				new Promise((r) =>
					setTimeout(() => {
						done = true;
						r();
					}, 20)
				)
		);
		const dispatcher = new ReactorDispatcher(createMockLogger() as any, [nonBlocking] as any);

		await dispatcher.dispatch(evaluation);

		expect(done).toBe(false); // resolved before the slow fire-and-forget reactor finished
	});

	it("isolates a throwing blocking reactor and still runs later reactors", async () => {
		const logger = createMockLogger();
		const bad = makeReactor("incident", true, () => Promise.reject(new Error("db error")));
		const good = makeReactor("after", true);
		const dispatcher = new ReactorDispatcher(logger as any, [bad, good] as any);

		await expect(dispatcher.dispatch(evaluation)).resolves.toBeUndefined();

		expect(good.react).toHaveBeenCalled();
		expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("db error") }));
	});

	it("isolates a rejecting non-blocking reactor (fire-and-forget)", async () => {
		const logger = createMockLogger();
		const bad = makeReactor("notification", false, () => Promise.reject(new Error("smtp down")));
		const dispatcher = new ReactorDispatcher(logger as any, [bad] as any);

		await dispatcher.dispatch(evaluation);
		await new Promise((r) => setTimeout(r, 10)); // let the detached catch run

		expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("smtp down") }));
	});
});
