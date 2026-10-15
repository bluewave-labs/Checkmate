import { describe, expect, it } from "@jest/globals";
import { logContext, withLogContext } from "../../../src/utils/logger/logContext.ts";

describe("withLogContext", () => {
	it("sets the context inside the callback and not outside it", () => {
		const inside = withLogContext({ reqId: "r1" }, () => logContext.getStore());

		expect(inside).toEqual({ reqId: "r1" });
		expect(logContext.getStore()).toBeUndefined();
	});

	it("merges nested contexts, with the inner value winning", () => {
		const nested = withLogContext({ reqId: "outer", jobId: "j1" }, () => withLogContext({ reqId: "inner", jobType: "check" }, () => logContext.getStore()));

		expect(nested).toEqual({ reqId: "inner", jobId: "j1", jobType: "check" });
	});

	it("restores the outer context after a nested call returns", () => {
		const outerAfter = withLogContext({ reqId: "outer" }, () => {
			withLogContext({ reqId: "inner" }, () => undefined);
			return logContext.getStore();
		});

		expect(outerAfter).toEqual({ reqId: "outer" });
	});

	it("keeps the context across an await", async () => {
		const afterAwait = await withLogContext({ reqId: "r1" }, async () => {
			await new Promise((resolve) => setTimeout(resolve, 1));
			return logContext.getStore();
		});

		expect(afterAwait).toEqual({ reqId: "r1" });
	});
});
