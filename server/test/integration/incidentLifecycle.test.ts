import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { IncidentService } from "../../src/domain/incidents/incident.service.ts";
import { InMemoryIncidentsRepository } from "../helpers/InMemoryIncidentsRepository.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";
import type { IMonitorsRepository } from "../../src/domain/monitors/monitor.repository.interface.ts";
import type { IUsersRepository } from "../../src/domain/users/user.repository.interface.ts";
import type { INotificationMessageBuilder } from "../../src/domain/notifications/notification.message-builder.ts";
import type { Monitor } from "../../src/domain/monitors/monitor.type.ts";
import type { MonitorActionDecision } from "../../src/worker/worker.interface.ts";
import type { Check } from "../../src/domain/checks/check.type.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		name: "Test Monitor",
		type: "http",
		url: "https://example.com",
		status: "down",
		...overrides,
	}) as Monitor;

const makeDecision = (overrides?: Partial<MonitorActionDecision>): MonitorActionDecision => ({
	shouldCreateIncident: false,
	shouldResolveIncident: false,
	shouldSendNotification: false,
	incidentReason: null,
	notificationReason: null,
	...overrides,
});

const makeCheck = (statusCode: number): Check => ({
	id: "check-1",
	metadata: { monitorId: "mon-1", teamId: "team-1", type: "http" },
	status: statusCode < 400,
	statusCode,
	responseTime: 100,
	message: statusCode < 400 ? "OK" : "Service Unavailable",
	createdAt: "2026-01-01T00:00:00Z",
	updatedAt: "2026-01-01T00:00:00Z",
});

// ── Test suite ───────────────────────────────────────────────────────────────

describe("Incident lifecycle (integration)", () => {
	let repo: InMemoryIncidentsRepository;
	let service: IncidentService;
	let monitorsRepo: jest.Mocked<IMonitorsRepository>;
	let usersRepo: jest.Mocked<IUsersRepository>;
	let messageBuilder: jest.Mocked<INotificationMessageBuilder>;

	beforeEach(() => {
		repo = new InMemoryIncidentsRepository();
		monitorsRepo = { findById: jest.fn() } as unknown as jest.Mocked<IMonitorsRepository>;
		usersRepo = { findById: jest.fn() } as unknown as jest.Mocked<IUsersRepository>;
		messageBuilder = { buildThresholdBreachMessage: jest.fn() } as unknown as jest.Mocked<INotificationMessageBuilder>;
		service = new IncidentService(createMockLogger() as any, repo, monitorsRepo, usersRepo, messageBuilder);
	});

	// ── Creation ─────────────────────────────────────────────────────────────

	it("creates an incident when monitor goes down", async () => {
		const monitor = makeMonitor({ status: "down" });
		const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" });

		const incident = await service.handleIncident(monitor, decision, makeCheck(503));

		expect(incident).not.toBeNull();
		expect(incident!.monitorId).toBe("mon-1");
		expect(incident!.teamId).toBe("team-1");
		expect(incident!.status).toBe(true);
		expect(incident!.statusCode).toBe(503);
		expect(incident!.endTime).toBeNull();
		expect(incident!.resolutionType).toBeNull();

		const stored = repo.getAll();
		expect(stored).toHaveLength(1);
		expect(stored[0].id).toBe(incident!.id);
	});

	// ── Idempotency ──────────────────────────────────────────────────────────

	it("does not create a duplicate incident for the same monitor", async () => {
		const monitor = makeMonitor({ status: "down" });
		const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" });

		const first = await service.handleIncident(monitor, decision, makeCheck(503));
		const second = await service.handleIncident(monitor, decision, makeCheck(503));

		expect(second!.id).toBe(first!.id);
		expect(repo.getAll()).toHaveLength(1);
	});

	// ── Auto-resolve ─────────────────────────────────────────────────────────

	it("auto-resolves an incident when monitor recovers", async () => {
		const monitor = makeMonitor({ status: "down" });
		const createDecision = makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" });
		const created = await service.handleIncident(monitor, createDecision, makeCheck(503));

		const resolveDecision = makeDecision({ shouldResolveIncident: true });
		const resolved = await service.handleIncident(monitor, resolveDecision, makeCheck(200));

		expect(resolved).not.toBeNull();
		expect(resolved!.id).toBe(created!.id);
		expect(resolved!.status).toBe(false);
		expect(resolved!.endTime).toBeDefined();
		expect(resolved!.resolutionType).toBe("automatic");
	});

	// ── Resolve with nothing active ──────────────────────────────────────────

	it("returns null when resolving with no active incident", async () => {
		const monitor = makeMonitor({ status: "up" });
		const decision = makeDecision({ shouldResolveIncident: true });

		const result = await service.handleIncident(monitor, decision, makeCheck(200));

		expect(result).toBeNull();
	});

	// ── Manual resolution ────────────────────────────────────────────────────

	it("manually resolves an active incident with comment", async () => {
		const monitor = makeMonitor({ status: "down" });
		const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" });
		const created = await service.handleIncident(monitor, decision, makeCheck(500));

		const resolved = await service.resolveIncident(created!.id, "user-1", "team-1", "Root cause identified", "user@test.com");

		expect(resolved.status).toBe(false);
		expect(resolved.resolutionType).toBe("manual");
		expect(resolved.resolvedBy).toBe("user-1");
		expect(resolved.resolvedByEmail).toBe("user@test.com");
		expect(resolved.comment).toBe("Root cause identified");
		expect(resolved.endTime).toBeDefined();
	});

	it("throws when manually resolving an already-resolved incident", async () => {
		const monitor = makeMonitor({ status: "down" });
		const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" });
		const created = await service.handleIncident(monitor, decision, makeCheck(500));

		await service.resolveIncident(created!.id, "user-1", "team-1");

		await expect(service.resolveIncident(created!.id, "user-1", "team-1")).rejects.toThrow("Incident not found");
	});

	// ── Threshold breach ─────────────────────────────────────────────────────

	it("creates a threshold breach incident with statusCode 9999 and descriptive message", async () => {
		const monitor = makeMonitor({ status: "breached", type: "hardware" });
		(messageBuilder.buildThresholdBreachMessage as jest.Mock).mockReturnValue("CPU: 92% (threshold: 80%), MEMORY: 88% (threshold: 85%)");
		const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "threshold_breach" });

		const incident = await service.handleIncident(monitor, decision, makeCheck(200));

		expect(incident!.statusCode).toBe(9999);
		expect(incident!.message).toBe("CPU: 92% (threshold: 80%), MEMORY: 88% (threshold: 85%)");
	});

	// ── No action ────────────────────────────────────────────────────────────

	it("returns null when no action is needed", async () => {
		const monitor = makeMonitor({ status: "up" });
		const decision = makeDecision();

		const result = await service.handleIncident(monitor, decision, makeCheck(200));

		expect(result).toBeNull();
		expect(repo.getAll()).toHaveLength(0);
	});

	// ── Full lifecycle ───────────────────────────────────────────────────────

	it("handles a complete lifecycle: create -> manual resolve -> new incident -> auto-resolve", async () => {
		const monitor = makeMonitor({ status: "down" });

		// First outage
		const first = await service.handleIncident(monitor, makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" }), makeCheck(503));
		expect(first!.status).toBe(true);

		// Manually resolved
		await service.resolveIncident(first!.id, "user-1", "team-1", "Restarted server");

		// Second outage — new incident since previous was resolved
		const second = await service.handleIncident(monitor, makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" }), makeCheck(502));
		expect(second!.id).not.toBe(first!.id);
		expect(second!.statusCode).toBe(502);

		// Auto-resolve
		const resolved = await service.handleIncident(monitor, makeDecision({ shouldResolveIncident: true }), makeCheck(200));
		expect(resolved!.id).toBe(second!.id);
		expect(resolved!.status).toBe(false);
		expect(resolved!.resolutionType).toBe("automatic");

		// Both incidents stored, both resolved
		const all = repo.getAll();
		expect(all).toHaveLength(2);
		expect(all.every((i) => i.status === false)).toBe(true);
	});

	// ── Cross-monitor isolation ──────────────────────────────────────────────

	it("incidents for different monitors do not interfere", async () => {
		const monitorA = makeMonitor({ id: "mon-a", status: "down" });
		const monitorB = makeMonitor({ id: "mon-b", status: "down" });
		const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" });

		const incidentA = await service.handleIncident(monitorA, decision, makeCheck(500));
		const incidentB = await service.handleIncident(monitorB, decision, makeCheck(502));

		expect(incidentA!.id).not.toBe(incidentB!.id);
		expect(repo.getAll()).toHaveLength(2);

		// Resolving monitor A does not affect monitor B
		const resolved = await service.handleIncident(monitorA, makeDecision({ shouldResolveIncident: true }), makeCheck(200));
		expect(resolved!.id).toBe(incidentA!.id);

		const bStillActive = await repo.findActiveByMonitorId("mon-b", "team-1");
		expect(bStillActive).not.toBeNull();
		expect(bStillActive!.status).toBe(true);
	});
});
