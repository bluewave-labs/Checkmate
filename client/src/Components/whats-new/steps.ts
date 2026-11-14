import type { ComponentType } from "react";
import {
	DashboardScene,
	DASHBOARD_SCENE_DURATION,
} from "@/Components/whats-new/scenes/DashboardScene";
import {
	HeartbeatScene,
	HEARTBEAT_SCENE_DURATION,
} from "@/Components/whats-new/scenes/HeartbeatScene";
import {
	RemoteAccessScene,
	REMOTE_ACCESS_SCENE_DURATION,
} from "@/Components/whats-new/scenes/RemoteAccessScene";
import {
	BackupScene,
	BACKUP_SCENE_DURATION,
} from "@/Components/whats-new/scenes/BackupScene";
import {
	IntervalScene,
	INTERVAL_SCENE_DURATION,
} from "@/Components/whats-new/scenes/IntervalScene";

// Identifies this set of steps. Change it when the steps change, so every user sees the popup once more.
export const WHATS_NEW_ID = "2026-11-dashboard-heartbeat-connect";

export const WhatsNewSteps = [
	"dashboard",
	"heartbeat",
	"remoteAccess",
	"backups",
	"intervals",
] as const;
export type WhatsNewStep = (typeof WhatsNewSteps)[number];

interface WhatsNewStepConfig {
	Scene: ComponentType<{ time: number }>;
	duration: number;
	// Checkmate Connect features carry the setup link, which only a superadmin can use
	connect: boolean;
}

export const whatsNewStepConfig: Record<WhatsNewStep, WhatsNewStepConfig> = {
	dashboard: {
		Scene: DashboardScene,
		duration: DASHBOARD_SCENE_DURATION,
		connect: false,
	},
	heartbeat: {
		Scene: HeartbeatScene,
		duration: HEARTBEAT_SCENE_DURATION,
		connect: false,
	},
	remoteAccess: {
		Scene: RemoteAccessScene,
		duration: REMOTE_ACCESS_SCENE_DURATION,
		connect: true,
	},
	backups: { Scene: BackupScene, duration: BACKUP_SCENE_DURATION, connect: true },
	intervals: { Scene: IntervalScene, duration: INTERVAL_SCENE_DURATION, connect: false },
};
