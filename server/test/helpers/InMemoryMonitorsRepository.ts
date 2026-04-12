import type { IMonitorsRepository, TeamQueryConfig, SummaryConfig } from "../../src/repositories/monitors/IMonitorsRepository.ts";
import type { Monitor, MonitorsSummary } from "../../src/types/index.ts";

export class InMemoryMonitorsRepository implements IMonitorsRepository {
	private monitors: Monitor[] = [];

	async create(monitor: Monitor, _teamId: string, _userId: string): Promise<Monitor> {
		this.monitors.push({ ...monitor });
		return { ...monitor };
	}

	async createMonitors(monitors: Monitor[]): Promise<Monitor[]> {
		const created = monitors.map((m) => ({ ...m }));
		this.monitors.push(...created);
		return created;
	}

	async findById(monitorId: string, teamId: string): Promise<Monitor> {
		const monitor = this.monitors.find((m) => m.id === monitorId && m.teamId === teamId);
		if (!monitor) {
			throw new Error(`Monitor ${monitorId} not found`);
		}
		return { ...monitor };
	}

	async findAll(): Promise<Monitor[]> {
		return this.monitors.map((m) => ({ ...m }));
	}

	async findByTeamId(_teamId: string, _config: TeamQueryConfig): Promise<Monitor[]> {
		return this.monitors.filter((m) => m.teamId === _teamId).map((m) => ({ ...m }));
	}

	async findByIds(monitorIds: string[]): Promise<Monitor[]> {
		return this.monitors.filter((m) => monitorIds.includes(m.id)).map((m) => ({ ...m }));
	}

	async findByIdsWithChecks(monitorIds: string[], _checksCount?: number): Promise<Monitor[]> {
		return this.findByIds(monitorIds);
	}

	async updateById(monitorId: string, teamId: string, updates: Partial<Monitor>): Promise<Monitor> {
		const index = this.monitors.findIndex((m) => m.id === monitorId && m.teamId === teamId);
		if (index === -1) {
			throw new Error(`Monitor ${monitorId} not found`);
		}
		const updated = { ...this.monitors[index], ...updates, id: this.monitors[index].id, teamId: this.monitors[index].teamId };
		this.monitors[index] = updated;
		return { ...updated };
	}

	async togglePauseById(monitorId: string, teamId: string): Promise<Monitor> {
		const monitor = await this.findById(monitorId, teamId);
		const newStatus = monitor.status === "paused" ? "up" : "paused";
		return this.updateById(monitorId, teamId, { status: newStatus });
	}

	async deleteById(monitorId: string, teamId: string): Promise<Monitor> {
		const index = this.monitors.findIndex((m) => m.id === monitorId && m.teamId === teamId);
		if (index === -1) {
			throw new Error(`Monitor ${monitorId} not found`);
		}
		const [deleted] = this.monitors.splice(index, 1);
		return { ...deleted };
	}

	async deleteByTeamId(teamId: string): Promise<{ monitors: Monitor[]; deletedCount: number }> {
		const toDelete = this.monitors.filter((m) => m.teamId === teamId);
		this.monitors = this.monitors.filter((m) => m.teamId !== teamId);
		return { monitors: toDelete, deletedCount: toDelete.length };
	}

	async findMonitorCountByTeamIdAndType(teamId: string, _config: TeamQueryConfig): Promise<number> {
		return this.monitors.filter((m) => m.teamId === teamId).length;
	}

	async findMonitorsSummaryByTeamId(_teamId: string, _config?: SummaryConfig): Promise<MonitorsSummary> {
		throw new Error("Not implemented");
	}

	async findGroupsByTeamId(_teamId: string): Promise<string[]> {
		throw new Error("Not implemented");
	}

	async removeNotificationFromMonitors(_notificationId: string): Promise<void> {
		throw new Error("Not implemented");
	}

	async updateNotifications(_teamId: string, _monitorIds: string[], _notificationIds: string[], _action: "add" | "remove" | "set"): Promise<number> {
		throw new Error("Not implemented");
	}

	async deleteByTeamIdsNotIn(teamIds: string[]): Promise<number> {
		const before = this.monitors.length;
		this.monitors = this.monitors.filter((m) => teamIds.includes(m.teamId));
		return before - this.monitors.length;
	}

	async findAllMonitorIds(): Promise<string[]> {
		return this.monitors.map((m) => m.id);
	}

	// Test helpers

	seed(monitor: Monitor): void {
		this.monitors.push({ ...monitor });
	}

	getAll(): Monitor[] {
		return this.monitors.map((m) => ({ ...m }));
	}

	clear(): void {
		this.monitors = [];
	}
}
