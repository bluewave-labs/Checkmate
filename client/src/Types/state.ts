import type { ChartType } from "@/Features/UI/uiSlice";
import type { User } from "./User";
import type { TimeFormat } from "@/Utils/TimeUtils";

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
	timeFormat: TimeFormat;
	distributedUptimeEnabled: boolean;
	language: string;
	starPromptOpen: boolean;
	chartType: ChartType;
}

export interface RootState {
	auth: AuthState;
	ui: UIState;
}
