import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { IncidentService } from "../../src/service/business/incidentService.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";
import type { IIncidentsRepository, IMonitorsRepository, IUsersRepository } from "../../src/repositories/index.ts";
import type { INotificationMessageBuilder } from "../../src/service/infrastructure/notificationMessageBuilder.ts";
import type { Monitor } from "../../src/types/monitor.ts";
import type { Incident } from "../../src/types/index.ts";
import type { MonitorActionDecision } from "../../src/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const createIncidentsRepo = () =>
	({
		findActiveByMonitorId: jest.fn(),
		findActiveByIncidentId: jest.fn(),
		create: jest.fn(),
		updateById: jest.fn(),
		findById: jest.fn(),
		findByTeamId: jest.fn(),
		countByTeamId: jest.fn(),
		findSummaryByTeamId: jest.fn(),
	}) as unknown as jest.Mocked<IIncidentsRepository>;

const createMonitorsRepo = () =>
	({
		findById: jest.fn(),
	}) as unknown as jest.Mocked<IMonitorsRepository>;

const createUsersRepo = () =>
	({
		findById: jest.fn(),
	}) as unknown as jest.Mocked<IUsersRepository>;

const createMessageBuilder = () =>
	({
		extractThresholdBreaches: jest.fn(),
	}) as unknown as jest.Mocked<INotificationMessageBuilder>;

const createService = (overrides?: {
	logger?: ReturnType<typeof createMockLogger>;
	incidentsRepository?: ReturnType<typeof createIncidentsRepo>;
	monitorsRepository?: ReturnType<typeof createMonitorsRepo>;
	usersRepository?: ReturnType<typeof createUsersRepo>;
	notificationMessageBuilder?: ReturnType<typeof createMessageBuilder>;
}) => {
	const logger = overrides?.logger ?? createMockLogger();
	const incidentsRepository = overrides?.incidentsRepository ?? createIncidentsRepo();
	const monitorsRepository = overrides?.monitorsRepository ?? createMonitorsRepo();
	const usersRepository = overrides?.usersRepository ?? createUsersRepo();
	const notificationMessageBuilder = overrides?.notificationMessageBuilder ?? createMessageBuilder();

	const service = new IncidentService(logger as any, incidentsRepository, monitorsRepository, usersRepository, notificationMessageBuilder);
	return { service, logger, incidentsRepository, monitorsRepository, usersRepository, notificationMessageBuilder };
};

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

const makeIncident = (overrides?: Partial<Incident>): Incident =>
	({
		id: "inc-1",
		monitorId: "mon-1",
		teamId: "team-1",
		startTime: "1700000000000",
		status: true,
		statusCode: 500,
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
		...overrides,
	}) as Incident;

const makeDecision = (overrides?: Partial<MonitorActionDecision>): MonitorActionDecision => ({
	shouldCreateIncident: false,
	shouldResolveIncident: false,
	shouldSendNotification: false,
	incidentReason: null,
	notificationReason: null,
	...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("IncidentService", () => {
	describe("serviceName", () => {
		it("returns incidentService", () => {
			const { service } = createService();
			expect(service.serviceName).toBe("incidentService");
		});
	});

	// ── handleIncident ───────────────────────────────────────────────────────

	describe("handleIncident", () => {
		it("returns null when neither create nor resolve is requested", async () => {
			const { service } = createService();
			const result = await service.handleIncident(makeMonitor(), 200, makeDecision());
			expect(result).toBeNull();
		});

		it("returns existing active incident when shouldCreateIncident and one already exists", async () => {
			const existing = makeIncident();
			const { service, incidentsRepository } = createService();
			(incidentsRepository.findActiveByMonitorId as jest.Mock).mockResolvedValue(existing);

			const result = await service.handleIncident(makeMonitor(), 500, makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" }));

			expect(result).toBe(existing);
			expect(incidentsRepository.create).not.toHaveBeenCalled();
		});

		it("creates a new incident when shouldCreateIncident and no active incident exists", async () => {
			const created = makeIncident();
			const { service, incidentsRepository } = createService();
			(incidentsRepository.findActiveByMonitorId as jest.Mock).mockResolvedValue(null);
			(incidentsRepository.create as jest.Mock).mockResolvedValue(created);

			const result = await service.handleIncident(makeMonitor(), 500, makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" }));

			expect(result).toBe(created);
			expect(incidentsRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					monitorId: "mon-1",
					teamId: "team-1",
					status: true,
					statusCode: 500,
				})
			);
		});

		it("uses status code 9999 and builds message for threshold_breach incidents", async () => {
			const created = makeIncident();
			const { service, incidentsRepository, notificationMessageBuilder } = createService();
			(incidentsRepository.findActiveByMonitorId as jest.Mock).mockResolvedValue(null);
			(incidentsRepository.create as jest.Mock).mockResolvedValue(created);
			(notificationMessageBuilder.extractThresholdBreaches as jest.Mock).mockReturnValue([
				{ metric: "cpu", formattedValue: "95%", threshold: 80, unit: "%" },
			]);

			const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "threshold_breach" });
			await service.handleIncident(makeMonitor(), 200, decision, { monitorId: "mon-1" } as any);

			expect(incidentsRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					statusCode: 9999,
					message: "CPU: 95% (threshold: 80%)",
				})
			);
		});

		it("uses fallback message when monitorStatusResponse is undefined for threshold_breach", async () => {
			const created = makeIncident();
			const { service, incidentsRepository } = createService();
			(incidentsRepository.findActiveByMonitorId as jest.Mock).mockResolvedValue(null);
			(incidentsRepository.create as jest.Mock).mockResolvedValue(created);

			const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "threshold_breach" });
			await service.handleIncident(makeMonitor(), 200, decision, undefined);

			expect(incidentsRepository.create).toHaveBeenCalledWith(expect.objectContaining({ message: "Threshold breach detected" }));
		});

		it("uses fallback message when extractThresholdBreaches returns empty array", async () => {
			const created = makeIncident();
			const { service, incidentsRepository, notificationMessageBuilder } = createService();
			(incidentsRepository.findActiveByMonitorId as jest.Mock).mockResolvedValue(null);
			(incidentsRepository.create as jest.Mock).mockResolvedValue(created);
			(notificationMessageBuilder.extractThresholdBreaches as jest.Mock).mockReturnValue([]);

			const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "threshold_breach" });
			await service.handleIncident(makeMonitor(), 200, decision, { monitorId: "mon-1" } as any);

			expect(incidentsRepository.create).toHaveBeenCalledWith(expect.objectContaining({ message: "Threshold breach detected" }));
		});

		it("joins multiple threshold breaches with commas", async () => {
			const created = makeIncident();
			const { service, incidentsRepository, notificationMessageBuilder } = createService();
			(incidentsRepository.findActiveByMonitorId as jest.Mock).mockResolvedValue(null);
			(incidentsRepository.create as jest.Mock).mockResolvedValue(created);
			(notificationMessageBuilder.extractThresholdBreaches as jest.Mock).mockReturnValue([
				{ metric: "cpu", formattedValue: "95%", threshold: 80, unit: "%" },
				{ metric: "memory", formattedValue: "90%", threshold: 80, unit: "%" },
			]);

			const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "threshold_breach" });
			await service.handleIncident(makeMonitor(), 200, decision, { monitorId: "mon-1" } as any);

			expect(incidentsRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({ message: "CPU: 95% (threshold: 80%), MEMORY: 90% (threshold: 80%)" })
			);
		});

		it("resolves active incident when shouldResolveIncident", async () => {
			const active = makeIncident();
			const resolved = makeIncident({ status: false, endTime: "123", resolutionType: "automatic" });
			const { service, incidentsRepository } = createService();
			(incidentsRepository.findActiveByMonitorId as jest.Mock).mockResolvedValue(active);
			(incidentsRepository.updateById as jest.Mock).mockResolvedValue(resolved);

			const result = await service.handleIncident(makeMonitor(), 200, makeDecision({ shouldResolveIncident: true }));

			expect(result).toBe(resolved);
			expect(incidentsRepository.updateById).toHaveBeenCalledWith(
				"inc-1",
				"team-1",
				expect.objectContaining({ status: false, resolutionType: "automatic" })
			);
		});

		it("returns null when shouldResolveIncident but no active incident exists", async () => {
			const { service, incidentsRepository } = createService();
			(incidentsRepository.findActiveByMonitorId as jest.Mock).mockResolvedValue(null);

			const result = await service.handleIncident(makeMonitor(), 200, makeDecision({ shouldResolveIncident: true }));

			expect(result).toBeNull();
		});
	});

	// ── resolveIncident ──────────────────────────────────────────────────────

	describe("resolveIncident", () => {
		it("resolves incident with manual resolution", async () => {
			const active = makeIncident();
			const resolved = makeIncident({ status: false });
			const { service, incidentsRepository } = createService();
			(incidentsRepository.findActiveByIncidentId as jest.Mock).mockResolvedValue(active);
			(incidentsRepository.updateById as jest.Mock).mockResolvedValue(resolved);

			const result = await service.resolveIncident("inc-1", "user-1", "team-1", "Fixed it", "user@test.com");

			expect(result).toBe(resolved);
			expect(incidentsRepository.updateById).toHaveBeenCalledWith(
				"inc-1",
				"team-1",
				expect.objectContaining({
					resolutionType: "manual",
					status: false,
					resolvedBy: "user-1",
					resolvedByEmail: "user@test.com",
					comment: "Fixed it",
				})
			);
		});

		it("sets resolvedByEmail and comment to null when not provided", async () => {
			const active = makeIncident();
			const resolved = makeIncident({ status: false });
			const { service, incidentsRepository } = createService();
			(incidentsRepository.findActiveByIncidentId as jest.Mock).mockResolvedValue(active);
			(incidentsRepository.updateById as jest.Mock).mockResolvedValue(resolved);

			await service.resolveIncident("inc-1", "user-1", "team-1");

			expect(incidentsRepository.updateById).toHaveBeenCalledWith(
				"inc-1",
				"team-1",
				expect.objectContaining({
					resolvedByEmail: null,
					comment: null,
				})
			);
		});

		it("throws when incidentId is missing", async () => {
			const { service } = createService();
			await expect(service.resolveIncident("", "user-1", "team-1")).rejects.toThrow("No incident ID in request");
		});

		it("throws when userId is missing", async () => {
			const { service } = createService();
			await expect(service.resolveIncident("inc-1", "", "team-1")).rejects.toThrow("No user ID in request");
		});

		it("throws when teamId is missing", async () => {
			const { service } = createService();
			await expect(service.resolveIncident("inc-1", "user-1", "")).rejects.toThrow("No team ID in request");
		});

		it("throws when incident is not found", async () => {
			const { service, incidentsRepository } = createService();
			(incidentsRepository.findActiveByIncidentId as jest.Mock).mockResolvedValue(null);

			await expect(service.resolveIncident("inc-1", "user-1", "team-1")).rejects.toThrow("Incident not found");
		});

		it("throws when incident is already resolved", async () => {
			const { service, incidentsRepository } = createService();
			(incidentsRepository.findActiveByIncidentId as jest.Mock).mockResolvedValue(makeIncident({ status: false }));

			await expect(service.resolveIncident("inc-1", "user-1", "team-1")).rejects.toThrow("Incident is already resolved");
		});

		it("logs error and rethrows on unexpected failure", async () => {
			const { service, logger, incidentsRepository } = createService();
			(incidentsRepository.findActiveByIncidentId as jest.Mock).mockRejectedValue(new Error("db error"));

			await expect(service.resolveIncident("inc-1", "user-1", "team-1")).rejects.toThrow("db error");
			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({ service: "incidentService", method: "resolveIncident", message: "db error" })
			);
		});

		it("logs 'Unknown error' for non-Error exceptions", async () => {
			const { service, logger, incidentsRepository } = createService();
			(incidentsRepository.findActiveByIncidentId as jest.Mock).mockRejectedValue("string error");

			await expect(service.resolveIncident("inc-1", "user-1", "team-1")).rejects.toBe("string error");
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "Unknown error", stack: undefined }));
		});
	});

	// ── getIncidentsByTeam ───────────────────────────────────────────────────

	describe("getIncidentsByTeam", () => {
		it("returns incidents and count", async () => {
			const incidents = [makeIncident()];
			const { service, incidentsRepository } = createService();
			(incidentsRepository.findByTeamId as jest.Mock).mockResolvedValue(incidents);
			(incidentsRepository.countByTeamId as jest.Mock).mockResolvedValue(1);

			const result = await service.getIncidentsByTeam("team-1", "desc", "day", 0, 20, undefined, undefined, undefined);

			expect(result).toEqual({ incidents, count: 1 });
		});

		it("defaults page to 0 and rowsPerPage to 20 when nullish", async () => {
			const { service, incidentsRepository } = createService();
			(incidentsRepository.findByTeamId as jest.Mock).mockResolvedValue([]);
			(incidentsRepository.countByTeamId as jest.Mock).mockResolvedValue(0);

			await service.getIncidentsByTeam("team-1", "desc", "day", null as any, null as any, undefined, undefined, undefined);

			expect(incidentsRepository.findByTeamId).toHaveBeenCalledWith("team-1", expect.anything(), 0, 20, "desc", undefined, undefined, undefined);
		});

		it("passes filter parameters through to repository", async () => {
			const { service, incidentsRepository } = createService();
			(incidentsRepository.findByTeamId as jest.Mock).mockResolvedValue([]);
			(incidentsRepository.countByTeamId as jest.Mock).mockResolvedValue(0);

			await service.getIncidentsByTeam("team-1", "asc", "week", 2, 10, true, "mon-1", "manual");

			expect(incidentsRepository.findByTeamId).toHaveBeenCalledWith("team-1", expect.any(Date), 2, 10, "asc", true, "mon-1", "manual");
			expect(incidentsRepository.countByTeamId).toHaveBeenCalledWith("team-1", expect.any(Date), true, "mon-1", "manual");
		});

		it("throws when teamId is missing", async () => {
			const { service } = createService();
			await expect(service.getIncidentsByTeam("", "desc", "day", 0, 20, undefined, undefined, undefined)).rejects.toThrow("No team ID in request");
		});

		it("logs error and rethrows on unexpected failure", async () => {
			const { service, logger, incidentsRepository } = createService();
			(incidentsRepository.findByTeamId as jest.Mock).mockRejectedValue(new Error("db error"));

			await expect(service.getIncidentsByTeam("team-1", "desc", "day", 0, 20, undefined, undefined, undefined)).rejects.toThrow("db error");
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ service: "incidentService", method: "getIncidentsByTeam" }));
		});

		it("logs 'Unknown error' for non-Error exceptions", async () => {
			const { service, logger, incidentsRepository } = createService();
			(incidentsRepository.findByTeamId as jest.Mock).mockRejectedValue(42);

			await expect(service.getIncidentsByTeam("team-1", "desc", "day", 0, 20, undefined, undefined, undefined)).rejects.toBe(42);
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "Unknown error", stack: undefined }));
		});
	});

	// ── getIncidentSummary ───────────────────────────────────────────────────

	describe("getIncidentSummary", () => {
		it("returns summary from repository", async () => {
			const summary = { recentIncidents: [], totalIncidents: 0 };
			const { service, incidentsRepository } = createService();
			(incidentsRepository.findSummaryByTeamId as jest.Mock).mockResolvedValue(summary);

			const result = await service.getIncidentSummary("team-1", 5);

			expect(result).toBe(summary);
			expect(incidentsRepository.findSummaryByTeamId).toHaveBeenCalledWith("team-1", 5);
		});

		it("defaults limit to 10 when not provided", async () => {
			const { service, incidentsRepository } = createService();
			(incidentsRepository.findSummaryByTeamId as jest.Mock).mockResolvedValue({});

			await service.getIncidentSummary("team-1");

			expect(incidentsRepository.findSummaryByTeamId).toHaveBeenCalledWith("team-1", 10);
		});

		it("throws when teamId is missing", async () => {
			const { service } = createService();
			await expect(service.getIncidentSummary("")).rejects.toThrow("No team ID in request");
		});

		it("logs error and rethrows on unexpected failure", async () => {
			const { service, logger, incidentsRepository } = createService();
			(incidentsRepository.findSummaryByTeamId as jest.Mock).mockRejectedValue(new Error("db error"));

			await expect(service.getIncidentSummary("team-1")).rejects.toThrow("db error");
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ service: "incidentService", method: "getIncidentSummary" }));
		});

		it("logs 'Unknown error' for non-Error exceptions", async () => {
			const { service, logger, incidentsRepository } = createService();
			(incidentsRepository.findSummaryByTeamId as jest.Mock).mockRejectedValue("boom");

			await expect(service.getIncidentSummary("team-1")).rejects.toBe("boom");
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "Unknown error", stack: undefined }));
		});
	});

	// ── getIncidentById ──────────────────────────────────────────────────────

	describe("getIncidentById", () => {
		it("returns incident, monitor, and user when resolvedBy exists", async () => {
			const incident = makeIncident({ resolvedBy: "user-1" });
			const monitor = makeMonitor();
			const user = { id: "user-1", email: "user@test.com" };
			const { service, incidentsRepository, monitorsRepository, usersRepository } = createService();
			(incidentsRepository.findById as jest.Mock).mockResolvedValue(incident);
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(usersRepository.findById as jest.Mock).mockResolvedValue(user);

			const result = await service.getIncidentById("inc-1", "team-1");

			expect(result).toEqual({ incident, monitor, user });
			expect(usersRepository.findById).toHaveBeenCalledWith("user-1");
		});

		it("returns user as null when resolvedBy is not set", async () => {
			const incident = makeIncident({ resolvedBy: undefined });
			const monitor = makeMonitor();
			const { service, incidentsRepository, monitorsRepository, usersRepository } = createService();
			(incidentsRepository.findById as jest.Mock).mockResolvedValue(incident);
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);

			const result = await service.getIncidentById("inc-1", "team-1");

			expect(result.user).toBeNull();
			expect(usersRepository.findById).not.toHaveBeenCalled();
		});

		it("logs error and rethrows on unexpected failure", async () => {
			const { service, logger, incidentsRepository } = createService();
			(incidentsRepository.findById as jest.Mock).mockRejectedValue(new Error("not found"));

			await expect(service.getIncidentById("inc-1", "team-1")).rejects.toThrow("not found");
			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({ service: "incidentService", method: "getIncidentById", details: { incidentId: "inc-1" } })
			);
		});

		it("logs 'Unknown error' for non-Error exceptions", async () => {
			const { service, logger, incidentsRepository } = createService();
			(incidentsRepository.findById as jest.Mock).mockRejectedValue(null);

			await expect(service.getIncidentById("inc-1", "team-1")).rejects.toBeNull();
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "Unknown error", stack: undefined }));
		});
	});
});
