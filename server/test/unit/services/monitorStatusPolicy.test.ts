import { describe, expect, it } from "@jest/globals";
import { MonitorStatusPolicy } from "../../../src/worker/worker.monitor-status-policy.ts";
import type { StatusChangeResult } from "../../../src/types/network.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeStatusChange = (overrides: Partial<StatusChangeResult> & { status?: string }): StatusChangeResult => {
	const { status = "up", ...rest } = overrides;
	return {
		monitor: { id: "m1", status } as any,
		statusChanged: false,
		prevStatus: "up",
		code: 200,
		timestamp: 0,
		...rest,
	} as StatusChangeResult;
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("MonitorStatusPolicy", () => {
	const policy = new MonitorStatusPolicy();

	it("does nothing when statusChanged is false", () => {
		const decision = policy.evaluate(makeStatusChange({ status: "down", statusChanged: false, prevStatus: "up" }));
		expect(decision).toEqual({
			shouldCreateIncident: false,
			shouldResolveIncident: false,
			shouldSendNotification: false,
			incidentReason: null,
			notificationReason: null,
		});
	});

	it("creates incident and notifies when monitor goes down", () => {
		const decision = policy.evaluate(makeStatusChange({ status: "down", statusChanged: true, prevStatus: "up", code: 500 }));
		expect(decision).toMatchObject({
			shouldCreateIncident: true,
			shouldSendNotification: true,
			incidentReason: "status_down",
			notificationReason: "status_change",
		});
	});

	it("creates incident and notifies when monitor is breached", () => {
		const decision = policy.evaluate(makeStatusChange({ status: "breached", statusChanged: true, prevStatus: "up" }));
		expect(decision).toMatchObject({
			shouldCreateIncident: true,
			shouldSendNotification: true,
			incidentReason: "threshold_breach",
			notificationReason: "threshold_breach",
		});
	});

	it("resolves incident when monitor recovers from down", () => {
		const decision = policy.evaluate(makeStatusChange({ status: "up", statusChanged: true, prevStatus: "down" }));
		expect(decision).toMatchObject({
			shouldResolveIncident: true,
			shouldSendNotification: true,
			shouldCreateIncident: false,
			notificationReason: "status_change",
		});
	});

	it("resolves incident when monitor recovers from breached", () => {
		const decision = policy.evaluate(makeStatusChange({ status: "up", statusChanged: true, prevStatus: "breached" }));
		expect(decision).toMatchObject({ shouldResolveIncident: true, shouldSendNotification: true });
	});

	it("does not create or resolve for unhandled status transitions", () => {
		const decision = policy.evaluate(makeStatusChange({ status: "paused", statusChanged: true, prevStatus: "up" }));
		expect(decision).toMatchObject({ shouldCreateIncident: false, shouldResolveIncident: false, shouldSendNotification: false });
	});
});
