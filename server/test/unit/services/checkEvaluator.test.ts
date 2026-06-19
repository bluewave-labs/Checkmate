import { describe, expect, it, jest } from "@jest/globals";
import { CheckEvaluator } from "../../../src/worker/worker.check-evaluator.ts";
import { MonitorStatusPolicy } from "../../../src/worker/worker.monitor-status-policy.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.types.ts";

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "m1",
		teamId: "team",
		type: "http",
		interval: 60000,
		status: "up",
		...overrides,
	}) as Monitor;

const createEvaluator = (overrides?: Record<string, any>) => {
	const defaults = {
		statusService: {
			updateMonitorStatus: jest.fn().mockResolvedValue({ monitor: makeMonitor({ status: "up" }), statusChanged: false, prevStatus: "up", code: 200 }),
		},
		monitorStatusPolicy: new MonitorStatusPolicy(),
		...overrides,
	};
	const evaluator = new CheckEvaluator(defaults.statusService as any, defaults.monitorStatusPolicy as any);
	return { evaluator, defaults };
};

describe("CheckEvaluator", () => {
	it("threads status, check, and monitor through to the status service", async () => {
		const { evaluator, defaults } = createEvaluator();
		const status = { monitorId: "m1", status: true, code: 200, message: "OK" } as any;
		const check = { id: "check-1" } as any;
		const monitor = makeMonitor({ status: "up" });

		await evaluator.evaluate(status, check, monitor);

		expect(defaults.statusService.updateMonitorStatus).toHaveBeenCalledWith(status, check, monitor);
	});

	it("returns an evaluation that opens an incident on a down transition", async () => {
		const status = { monitorId: "m1", status: false, code: 500, message: "Error" } as any;
		const check = { id: "check-1" } as any;
		const statusChange = { monitor: makeMonitor({ status: "down" }), statusChanged: true, prevStatus: "up", code: 500 };
		const { evaluator } = createEvaluator({
			statusService: { updateMonitorStatus: jest.fn().mockResolvedValue(statusChange) },
		});

		const result = await evaluator.evaluate(status, check, makeMonitor());

		expect(result).toMatchObject({
			monitor: statusChange.monitor,
			status,
			check,
			statusChange,
			decision: expect.objectContaining({
				shouldCreateIncident: true,
				shouldSendNotification: true,
				incidentReason: "status_down",
			}),
		});
	});

	it("returns an evaluation that resolves an incident on recovery", async () => {
		const status = { monitorId: "m1", status: true, code: 200, message: "OK" } as any;
		const statusChange = { monitor: makeMonitor({ status: "up" }), statusChanged: true, prevStatus: "down", code: 200 };
		const { evaluator } = createEvaluator({
			statusService: { updateMonitorStatus: jest.fn().mockResolvedValue(statusChange) },
		});

		const result = await evaluator.evaluate(status, { id: "check-1" } as any, makeMonitor({ status: "down" }));

		expect(result.decision).toMatchObject({ shouldResolveIncident: true, shouldSendNotification: true });
	});

	it("produces a no-op decision when status did not change", async () => {
		const status = { monitorId: "m1", status: true, code: 200, message: "OK" } as any;
		const { evaluator } = createEvaluator();

		const result = await evaluator.evaluate(status, { id: "check-1" } as any, makeMonitor());

		expect(result.decision).toMatchObject({
			shouldCreateIncident: false,
			shouldResolveIncident: false,
			shouldSendNotification: false,
		});
	});
});
