import { describe, expect, it, jest } from "@jest/globals";
import { CheckService } from "../../../src/domain/checks/check.service.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { IChecksRepository } from "../../../src/domain/checks/check.repository.interface.ts";
import type { IMonitorsRepository } from "../../../src/domain/monitors/monitor.repository.interface.ts";
import type { MonitorStatusResponse, HardwareStatusPayload, PageSpeedStatusPayload } from "../../../src/types/network.ts";
import { NotificationMessageBuilder } from "../../../src/domain/notifications/notification.message-builder.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const createMonitorsRepo = () =>
	({
		findById: jest.fn().mockResolvedValue({}),
	}) as unknown as jest.Mocked<IMonitorsRepository>;

const createChecksRepo = () =>
	({
		createChecks: jest.fn().mockImplementation((checks: unknown) => Promise.resolve(checks)),
		findByMonitorId: jest.fn().mockResolvedValue({ checks: [], count: 0 }),
		findByTeamId: jest.fn().mockResolvedValue({ checks: [], count: 0 }),
		findSummaryByTeamId: jest.fn().mockResolvedValue({}),
		deleteByMonitorId: jest.fn().mockResolvedValue(5),
		deleteByTeamId: jest.fn().mockResolvedValue(10),
		deleteOlderThan: jest.fn().mockResolvedValue(3),
	}) as unknown as jest.Mocked<IChecksRepository>;

const createService = () => {
	const logger = createMockLogger();
	const monitorsRepository = createMonitorsRepo();
	const checksRepository = createChecksRepo();
	const service = new CheckService(monitorsRepository, logger as any, checksRepository);
	return { service, logger, monitorsRepository, checksRepository };
};

const makeStatusResponse = (overrides?: Partial<MonitorStatusResponse>): MonitorStatusResponse =>
	({
		monitorId: "mon-1",
		teamId: "team-1",
		type: "http",
		status: true,
		code: 200,
		message: "OK",
		responseTime: 100,
		...overrides,
	}) as MonitorStatusResponse;

// ── Tests ────────────────────────────────────────────────────────────────────

describe("CheckService", () => {
	// ── toCheck ──────────────────────────────────────────────────────────────

	describe("toCheck", () => {
		it("builds a basic HTTP check with correct fields", () => {
			const { service } = createService();
			const check = service.toCheck(makeStatusResponse());

			expect(check).toBeDefined();
			expect(check!.metadata).toEqual({ monitorId: "mon-1", teamId: "team-1", type: "http" });
			expect(check!.status).toBe(true);
			expect(check!.statusCode).toBe(200);
			expect(check!.responseTime).toBe(100);
			expect(check!.message).toBe("OK");
			expect(check!.id).toBeDefined();
			expect(check!.createdAt).toBeDefined();
		});

		it("defaults responseTime to 0 when falsy", () => {
			const { service } = createService();
			const check = service.toCheck(makeStatusResponse({ responseTime: undefined }));
			expect(check!.responseTime).toBe(0);
		});

		it("includes timings when provided", () => {
			const timings = { start: 0, socket: 10, lookup: 20 };
			const { service } = createService();
			const check = service.toCheck(makeStatusResponse({ timings } as any));
			expect(check!.timings).toBe(timings);
		});

		// ── PageSpeed ────────────────────────────────────────────────────────

		describe("pagespeed type", () => {
			it("extracts category scores and audits from lighthouse result", () => {
				const payload: PageSpeedStatusPayload = {
					lighthouseResult: {
						categories: {
							accessibility: { score: 0.9 },
							"best-practices": { score: 0.8 },
							seo: { score: 0.95 },
							performance: { score: 0.7 },
						},
						audits: {
							"cumulative-layout-shift": { id: "cls", title: "CLS", score: 0.1, displayValue: "0.1", numericValue: 0.1, numericUnit: "unitless" },
							"speed-index": { id: "si", title: "SI", score: 0.5, displayValue: "3.0s", numericValue: 3000, numericUnit: "millisecond" },
							"first-contentful-paint": { id: "fcp", title: "FCP", score: 0.8 },
							"largest-contentful-paint": { id: "lcp", title: "LCP", score: 0.6 },
							"total-blocking-time": { id: "tbt", title: "TBT", score: 0.9 },
						},
					},
				} as any;

				const { service } = createService();
				const check = service.toCheck(makeStatusResponse({ type: "pagespeed", payload } as any));

				expect(check!.accessibility).toBe(90);
				expect(check!.bestPractices).toBe(80);
				expect(check!.seo).toBe(95);
				expect(check!.performance).toBe(70);
				expect(check!.audits!.cls).toEqual(expect.objectContaining({ id: "cls", score: 0.1, numericValue: 0.1 }));
				expect(check!.audits!.si).toEqual(expect.objectContaining({ id: "si", numericValue: 3000 }));
				expect(check!.audits!.fcp).toEqual(expect.objectContaining({ id: "fcp" }));
			});

			it("returns undefined when pagespeed payload is missing", () => {
				const { service, logger } = createService();
				const check = service.toCheck(makeStatusResponse({ type: "pagespeed", payload: undefined } as any));

				expect(check).toBeUndefined();
				expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "Failed to build check" }));
			});

			it("defaults categories and audits to empty when lighthouseResult is missing", () => {
				const { service } = createService();
				const check = service.toCheck(makeStatusResponse({ type: "pagespeed", payload: {} } as any));

				expect(check!.accessibility).toBe(0);
				expect(check!.bestPractices).toBe(0);
				expect(check!.seo).toBe(0);
				expect(check!.performance).toBe(0);
				expect(check!.audits!.cls).toBeUndefined();
			});

			it("handles audit with non-number score (string)", () => {
				const payload = {
					lighthouseResult: {
						categories: {},
						audits: {
							"cumulative-layout-shift": { id: "cls", title: "CLS", score: "informative" },
						},
					},
				} as any;
				const { service } = createService();
				const check = service.toCheck(makeStatusResponse({ type: "pagespeed", payload } as any));

				expect(check!.audits!.cls!.score).toBe("informative");
			});

			it("handles audit with null score", () => {
				const payload = {
					lighthouseResult: {
						categories: {},
						audits: {
							"cumulative-layout-shift": { id: "cls", title: "CLS", score: null },
						},
					},
				} as any;
				const { service } = createService();
				const check = service.toCheck(makeStatusResponse({ type: "pagespeed", payload } as any));

				expect(check!.audits!.cls!.score).toBeNull();
			});

			it("handles audit with non-number numericValue", () => {
				const payload = {
					lighthouseResult: {
						categories: {},
						audits: {
							"speed-index": { id: "si", title: "SI", score: 0.5, numericValue: "n/a" },
						},
					},
				} as any;
				const { service } = createService();
				const check = service.toCheck(makeStatusResponse({ type: "pagespeed", payload } as any));

				expect(check!.audits!.si!.numericValue).toBeUndefined();
			});

			it("returns undefined for non-object audit", () => {
				const payload = {
					lighthouseResult: {
						categories: {},
						audits: {
							"cumulative-layout-shift": null,
							"speed-index": "not an object",
						},
					},
				} as any;
				const { service } = createService();
				const check = service.toCheck(makeStatusResponse({ type: "pagespeed", payload } as any));

				expect(check!.audits!.cls).toBeUndefined();
				expect(check!.audits!.si).toBeUndefined();
			});
		});

		// ── Hardware ─────────────────────────────────────────────────────────

		describe("hardware type", () => {
			it("extracts cpu, memory, disk, host, net, and capture from payload", () => {
				const payload: HardwareStatusPayload = {
					data: {
						cpu: { usage_percent: 0.5 },
						memory: { usage_percent: 0.6 },
						disk: [{ device: "/dev/sda", usage_percent: 0.7 }],
						host: { os: "linux" },
						net: [{ name: "eth0" }],
					},
					capture: { screenshot: "base64data" },
				} as any;
				const { service } = createService();
				const check = service.toCheck(makeStatusResponse({ type: "hardware", payload } as any));

				expect(check!.cpu).toEqual({ usage_percent: 0.5 });
				expect(check!.memory).toEqual({ usage_percent: 0.6 });
				expect(check!.disk).toHaveLength(1);
				expect(check!.host).toEqual({ os: "linux" });
				expect(check!.net).toHaveLength(1);
				expect(check!.capture).toEqual({ screenshot: "base64data" });
			});

			it("extracts errors from array format", () => {
				const payload = {
					data: {},
					errors: [{ message: "timeout" }],
				} as any;
				const { service } = createService();
				const check = service.toCheck(makeStatusResponse({ type: "hardware", payload } as any));

				expect(check!.errors).toEqual([{ message: "timeout" }]);
			});

			it("extracts errors from nested object format", () => {
				const payload = {
					data: {},
					errors: { errors: [{ message: "nested error" }] },
				} as any;
				const { service } = createService();
				const check = service.toCheck(makeStatusResponse({ type: "hardware", payload } as any));

				expect(check!.errors).toEqual([{ message: "nested error" }]);
			});

			it("handles undefined payload gracefully", () => {
				const { service } = createService();
				const check = service.toCheck(makeStatusResponse({ type: "hardware", payload: undefined } as any));

				expect(check).toBeDefined();
				expect(check!.cpu).toBeUndefined();
				expect(check!.memory).toBeUndefined();
				expect(check!.disk).toBeUndefined();
				expect(check!.errors).toBeUndefined();
			});
		});
	});

	// ── toStatusResponse round-trip (Phase 2 §5 guard) ─────────────────────────
	// The DB-queue split persists a Check, then the evaluator rebuilds the status response from it.
	// toStatusResponse is only correct because every field a downstream consumer reads survives
	// toCheck → toStatusResponse. These tests pin that: if a future change drops a consumed field
	// from the round-trip, they fail instead of silently regressing the evaluator/reactors.

	describe("toStatusResponse round-trip", () => {
		const makeHardwareStatus = (overrides?: Partial<MonitorStatusResponse>): MonitorStatusResponse =>
			makeStatusResponse({
				type: "hardware",
				status: true,
				code: 200,
				message: "OK",
				responseTime: 42,
				payload: {
					data: {
						cpu: { usage_percent: 0.92 },
						memory: { usage_percent: 0.81 },
						disk: [{ device: "/dev/sda", usage_percent: 0.75 }],
						host: { os: "linux" },
						net: [{ name: "eth0" }],
					},
				} as HardwareStatusPayload,
				...overrides,
			} as any);

		it("uptime: preserves every consumed scalar field", () => {
			const { service } = createService();
			const status = makeStatusResponse({ type: "http", status: false, code: 503, message: "Service Unavailable", responseTime: 87 });

			const rebuilt = service.toStatusResponse(service.toCheck(status)!);

			expect(rebuilt.monitorId).toBe(status.monitorId);
			expect(rebuilt.teamId).toBe(status.teamId);
			expect(rebuilt.type).toBe(status.type);
			expect(rebuilt.status).toBe(status.status);
			expect(rebuilt.code).toBe(status.code);
			expect(rebuilt.message).toBe(status.message);
			expect(rebuilt.responseTime).toBe(status.responseTime);
		});

		it("hardware: preserves payload.data metrics verbatim, same units (usage_percent stays a 0–1 decimal)", () => {
			const { service } = createService();
			const status = makeHardwareStatus();

			const rebuilt = service.toStatusResponse(service.toCheck(status)!);

			const original = status.payload as HardwareStatusPayload;
			const roundtripped = rebuilt.payload as HardwareStatusPayload;
			expect(roundtripped.data).toEqual(original.data);
			expect(roundtripped.data.cpu!.usage_percent).toBe(0.92); // not rescaled to 92
		});

		it("hardware: a real consumer (extractThresholdBreaches) behaves identically on raw vs round-tripped status", () => {
			const { service } = createService();
			const builder = new NotificationMessageBuilder();
			const monitor = {
				id: "mon-1",
				type: "hardware",
				cpuAlertThreshold: 90, // 0.92 → 92% breaches
				memoryAlertThreshold: 90, // 0.81 → 81% does not
				diskAlertThreshold: 90, // 0.75 → 75% does not
				tempAlertThreshold: 100,
			} as Monitor;
			const status = makeHardwareStatus();

			const rebuilt = service.toStatusResponse(service.toCheck(status)!);

			const fromRaw = builder.extractThresholdBreaches(monitor, status as MonitorStatusResponse<HardwareStatusPayload>);
			const fromRebuilt = builder.extractThresholdBreaches(monitor, rebuilt as MonitorStatusResponse<HardwareStatusPayload>);

			// sanity: the fixture actually triggers a breach, so the equality below is not vacuous
			expect(fromRaw).toHaveLength(1);
			expect(fromRaw[0].metric).toBe("cpu");
			expect(fromRebuilt).toEqual(fromRaw);
		});
	});

	// ── createChecks ─────────────────────────────────────────────────────────

	describe("createChecks", () => {
		it("delegates to repository", async () => {
			const { service, checksRepository } = createService();
			const checks = [{ id: "c1" }] as any;
			await service.createChecks(checks);
			expect(checksRepository.createChecks).toHaveBeenCalledWith(checks);
		});
	});

	// ── getChecksByMonitor ───────────────────────────────────────────────────

	describe("getChecksByMonitor", () => {
		it("returns checks from repository", async () => {
			const expected = { checks: [{ id: "c1" }], count: 1 };
			const { service, checksRepository } = createService();
			(checksRepository.findByMonitorId as jest.Mock).mockResolvedValue(expected);

			const result = await service.getChecksByMonitor({
				monitorId: "mon-1",
				teamId: "team-1",
				sortOrder: "desc",
				dateRange: "day",
				page: 0,
				rowsPerPage: 10,
			});

			expect(result).toBe(expected);
		});

		it("defaults page to 0 and rowsPerPage to 5 when nullish", async () => {
			const { service, checksRepository } = createService();

			await service.getChecksByMonitor({
				monitorId: "mon-1",
				teamId: "team-1",
				sortOrder: "desc",
				dateRange: "day",
				page: null as any,
				rowsPerPage: null as any,
			});

			expect(checksRepository.findByMonitorId).toHaveBeenCalledWith("mon-1", "desc", "day", 0, 5, undefined, undefined);
		});

		it("passes filter and status parameters", async () => {
			const { service, checksRepository } = createService();

			await service.getChecksByMonitor({
				monitorId: "mon-1",
				teamId: "team-1",
				sortOrder: "asc",
				dateRange: "week",
				page: 2,
				rowsPerPage: 20,
				filter: "resolve",
				status: false,
			});

			expect(checksRepository.findByMonitorId).toHaveBeenCalledWith("mon-1", "asc", "week", 2, 20, false, "resolve");
		});

		it("throws when monitorId is missing", async () => {
			const { service } = createService();
			await expect(
				service.getChecksByMonitor({ monitorId: "", teamId: "team-1", sortOrder: "desc", dateRange: "day", page: 0, rowsPerPage: 10 })
			).rejects.toThrow("No monitor ID in request");
		});

		it("throws when teamId is missing", async () => {
			const { service } = createService();
			await expect(
				service.getChecksByMonitor({ monitorId: "mon-1", teamId: "", sortOrder: "desc", dateRange: "day", page: 0, rowsPerPage: 10 })
			).rejects.toThrow("No team ID in request");
		});

		it("verifies monitor belongs to team via repository", async () => {
			const { service, monitorsRepository } = createService();

			await service.getChecksByMonitor({
				monitorId: "mon-1",
				teamId: "team-1",
				sortOrder: "desc",
				dateRange: "day",
				page: 0,
				rowsPerPage: 10,
			});

			expect(monitorsRepository.findById).toHaveBeenCalledWith("mon-1", "team-1");
		});
	});

	// ── getChecksByTeam ──────────────────────────────────────────────────────

	describe("getChecksByTeam", () => {
		it("returns checks from repository", async () => {
			const expected = { checks: [], count: 0 };
			const { service, checksRepository } = createService();
			(checksRepository.findByTeamId as jest.Mock).mockResolvedValue(expected);

			const result = await service.getChecksByTeam({ teamId: "team-1", sortOrder: "desc", dateRange: "day", page: 0, rowsPerPage: 10 });

			expect(result).toBe(expected);
		});

		it("defaults page to 0 and rowsPerPage to 5 when nullish", async () => {
			const { service, checksRepository } = createService();

			await service.getChecksByTeam({ teamId: "team-1", sortOrder: "desc", dateRange: "day", page: null as any, rowsPerPage: null as any });

			expect(checksRepository.findByTeamId).toHaveBeenCalledWith("desc", "day", 0, 5, "team-1", undefined);
		});
	});

	// ── getChecksSummaryByTeamId ──────────────────────────────────────────────

	describe("getChecksSummaryByTeamId", () => {
		it("delegates to repository", async () => {
			const summary = { total: 5, up: 4, down: 1 };
			const { service, checksRepository } = createService();
			(checksRepository.findSummaryByTeamId as jest.Mock).mockResolvedValue(summary);

			const result = await service.getChecksSummaryByTeamId({ teamId: "team-1", dateRange: "day" });

			expect(result).toBe(summary);
			expect(checksRepository.findSummaryByTeamId).toHaveBeenCalledWith("team-1", "day");
		});
	});

	// ── deleteChecks ─────────────────────────────────────────────────────────

	describe("deleteChecks", () => {
		it("verifies monitor ownership and deletes", async () => {
			const { service, monitorsRepository, checksRepository } = createService();

			const result = await service.deleteChecks({ monitorId: "mon-1", teamId: "team-1" });

			expect(monitorsRepository.findById).toHaveBeenCalledWith("mon-1", "team-1");
			expect(checksRepository.deleteByMonitorId).toHaveBeenCalledWith("mon-1");
			expect(result).toBe(5);
		});
	});

	describe("deleteChecksByTeamId", () => {
		it("delegates to repository", async () => {
			const { service, checksRepository } = createService();

			const result = await service.deleteChecksByTeamId({ teamId: "team-1" });

			expect(checksRepository.deleteByTeamId).toHaveBeenCalledWith("team-1");
			expect(result).toBe(10);
		});
	});

	describe("deleteOlderThan", () => {
		it("delegates to repository", async () => {
			const date = new Date();
			const { service, checksRepository } = createService();

			const result = await service.deleteOlderThan(date);

			expect(checksRepository.deleteOlderThan).toHaveBeenCalledWith(date);
			expect(result).toBe(3);
		});
	});
});
