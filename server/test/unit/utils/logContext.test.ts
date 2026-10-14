import { describe, expect, it } from "@jest/globals";
import { addLogContext, getLogContext, runWithLogContext } from "../../../src/utils/logContext.ts";

const tick = () => new Promise((resolve) => setTimeout(resolve, 1));

describe("logContext", () => {
	it("has no context outside a scope", () => {
		expect(getLogContext()).toBeUndefined();
	});

	it("exposes the context inside a scope and returns the callback's result", () => {
		const result = runWithLogContext({ requestId: "r1" }, () => getLogContext());
		expect(result).toEqual({ requestId: "r1" });
	});

	it("merges nested scopes over the outer one without changing it", () => {
		runWithLogContext({ requestId: "r1", teamId: "t1" }, () => {
			runWithLogContext({ jobId: "j1", teamId: "t2" }, () => {
				expect(getLogContext()).toEqual({ requestId: "r1", teamId: "t2", jobId: "j1" });
			});
			expect(getLogContext()).toEqual({ requestId: "r1", teamId: "t1" });
		});
	});

	it("keeps the context across await", async () => {
		const seen = await runWithLogContext({ jobId: "j1" }, async () => {
			await tick();
			return getLogContext();
		});
		expect(seen).toEqual({ jobId: "j1" });
	});

	it("isolates concurrent scopes", async () => {
		const read = (jobId: string) =>
			runWithLogContext({ jobId }, async () => {
				await tick();
				return getLogContext()?.jobId;
			});
		expect(await Promise.all([read("a"), read("b")])).toEqual(["a", "b"]);
	});

	it("adds fields to the active scope", () => {
		runWithLogContext({ requestId: "r1" }, () => {
			addLogContext({ userId: "u1" });
			expect(getLogContext()).toEqual({ requestId: "r1", userId: "u1" });
		});
	});

	it("ignores addLogContext outside a scope", () => {
		addLogContext({ userId: "u1" });
		expect(getLogContext()).toBeUndefined();
	});
});
