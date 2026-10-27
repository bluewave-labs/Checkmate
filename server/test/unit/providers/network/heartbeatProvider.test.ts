import { describe, expect, it } from "@jest/globals";
import { HeartbeatProvider, HEARTBEAT_MISSED_CODE } from "../../../../src/service/networkProviders/HeartbeatProvider.ts";
import { testStatusProviderContract } from "../../../helpers/statusProviderContract.ts";
import type { Monitor } from "../../../../src/domain/monitors/monitor.type.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		type: "heartbeat",
		url: "",
		interval: 60000,
		...overrides,
	}) as Monitor;

const setup = () => {
	const provider = new HeartbeatProvider();
	return { provider };
};

// ── Contract ─────────────────────────────────────────────────────────────────

testStatusProviderContract("HeartbeatProvider", {
	create: () => setup().provider,
	supportedType: "heartbeat",
	unsupportedType: "http",
	makeMonitor: () => makeMonitor(),
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("HeartbeatProvider", () => {
	it("returns a missed-ping down status", async () => {
		const { provider } = setup();

		const result = await provider.handle(makeMonitor());

		expect(result).toEqual({
			monitorId: "mon-1",
			teamId: "team-1",
			type: "heartbeat",
			status: false,
			code: HEARTBEAT_MISSED_CODE,
			message: "Ping not received",
			responseTime: 0,
			payload: null,
		});
	});

	it("uses 408 as the missed-ping code", () => {
		expect(HEARTBEAT_MISSED_CODE).toBe(408);
	});

	it("carries the monitor's own ids", async () => {
		const { provider } = setup();

		const result = await provider.handle(makeMonitor({ id: "mon-2", teamId: "team-2" }));

		expect(result.monitorId).toBe("mon-2");
		expect(result.teamId).toBe("team-2");
	});

	it("does not support other monitor types", () => {
		const { provider } = setup();

		for (const type of ["http", "ping", "port", "docker", "hardware", "unknown"] as const) {
			expect(provider.supports(type)).toBe(false);
		}
	});
});
