import type { ChartType } from "@/Features/UI/uiSlice";
import type { User } from "./User";
import type { DashboardCardId } from "@/Pages/Dashboard/dashboardCards";

export interface AuthState {
	isLoading: boolean;
	authToken: string;
	user: User | null;
	success: boolean | null;
	msg: string | null;
}

export interface UIState {
	monitors: {
		rowsPerPage: number;
	};
	team: {
		rowsPerPage: number;
	};
	maintenance: {
		rowsPerPage: number;
	};
	infrastructure: {
		rowsPerPage: number;
	};
	logs: {
		rowsPerPage: number;
	};
	sidebar: {
		collapsed: boolean;
	};
	mode: "light" | "dark";
	showURL: boolean;
	greeting: {
		index: number;
		lastUpdate: string | null;
	};
	timezone: string;
	distributedUptimeEnabled: boolean;
	language: string;
	starPromptOpen: boolean;
	chartType: ChartType;
	dashboardCards: Record<DashboardCardId, boolean>;
	dashboardCardOrder: DashboardCardId[];
}

export interface RootState {
	auth: AuthState;
	ui: UIState;
}
