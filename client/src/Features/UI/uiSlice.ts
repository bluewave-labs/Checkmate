import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
	DASHBOARD_CARD_IDS,
	defaultVisibleCards,
	type DashboardCardId,
} from "@/Pages/Dashboard/dashboardCards";

type ThemeMode = "light" | "dark";
type ChartType = "histogram" | "line";
type TableName =
	| "monitors"
	| "team"
	| "maintenance"
	| "infrastructure"
	| "logs"
	| "pagespeed"
	| "docker";

interface TableState {
	rowsPerPage: number;
}

interface SidebarState {
	collapsed: boolean;
}

interface UIState {
	monitors: TableState;
	pagespeed: TableState;
	team: TableState;
	maintenance: TableState;
	infrastructure: TableState;
	docker: TableState;
	logs: TableState;
	sidebar: SidebarState;
	mode: ThemeMode;
	showURL: boolean;
	timezone: string;
	distributedUptimeEnabled: boolean;
	language: string;
	starPromptOpen: boolean;
	chartType: ChartType;
	dashboardCards: Record<DashboardCardId, boolean>;
	dashboardCardOrder: DashboardCardId[];
}

const initialMode: ThemeMode = window?.matchMedia?.("(prefers-color-scheme: dark)")
	?.matches
	? "dark"
	: "light";

const initialState: UIState = {
	monitors: {
		rowsPerPage: 10,
	},
	pagespeed: {
		rowsPerPage: 10,
	},
	team: {
		rowsPerPage: 5,
	},
	maintenance: {
		rowsPerPage: 5,
	},
	infrastructure: {
		rowsPerPage: 5,
	},
	docker: {
		rowsPerPage: 5,
	},
	logs: {
		rowsPerPage: 15,
	},
	sidebar: {
		collapsed: false,
	},
	mode: initialMode,
	showURL: false,
	timezone: "America/Toronto",
	distributedUptimeEnabled: false,
	language: "en",
	starPromptOpen: true,
	chartType: "histogram",
	dashboardCards: { ...defaultVisibleCards },
	dashboardCardOrder: [...DASHBOARD_CARD_IDS],
};

const uiSlice = createSlice({
	name: "ui",
	initialState,
	reducers: {
		setDistributedUptimeEnabled: (state, action: PayloadAction<boolean>) => {
			state.distributedUptimeEnabled = action.payload;
		},
		setRowsPerPage: (
			state,
			action: PayloadAction<{ table: TableName; value: number }>
		) => {
			const { table, value } = action.payload;
			state[table].rowsPerPage = value;
		},
		toggleSidebar: (state) => {
			state.sidebar.collapsed = !state.sidebar.collapsed;
		},
		setCollapsed: (state, action: PayloadAction<{ collapsed: boolean }>) => {
			state.sidebar.collapsed = action.payload.collapsed;
		},
		setMode: (state, action: PayloadAction<ThemeMode>) => {
			state.mode = action.payload;
		},
		setShowURL: (state, action: PayloadAction<boolean>) => {
			state.showURL = action.payload;
		},

		setTimezone: (state, action: PayloadAction<{ timezone: string }>) => {
			if (action.payload.timezone) {
				state.timezone = action.payload.timezone;
			}
		},
		setLanguage: (state, action: PayloadAction<string>) => {
			state.language = action.payload;
		},
		setStarPromptOpen: (state, action: PayloadAction<boolean>) => {
			state.starPromptOpen = action.payload;
		},
		setChartType: (state, action: PayloadAction<ChartType>) => {
			state.chartType = action.payload;
		},
		setDashboardCards: (
			state,
			action: PayloadAction<Record<DashboardCardId, boolean>>
		) => {
			state.dashboardCards = action.payload;
		},
		setDashboardCardsVisibility: (
			state,
			action: PayloadAction<{ id: DashboardCardId; visible: boolean }>
		) => {
			state.dashboardCards[action.payload.id] = action.payload.visible;
		},
		toggleDashboardCard: (state, action: PayloadAction<DashboardCardId>) => {
			state.dashboardCards[action.payload] = !state.dashboardCards[action.payload];
		},
		resetDashboardCards: (state) => {
			state.dashboardCards = { ...defaultVisibleCards };
		},
		setDashboardCardOrder: (state, action: PayloadAction<DashboardCardId[]>) => {
			state.dashboardCardOrder = action.payload;
		},
	},
});

export type { UIState, ThemeMode, ChartType, TableName };
export default uiSlice.reducer;
export const {
	setRowsPerPage,
	toggleSidebar,
	setCollapsed,
	setMode,
	setShowURL,
	setTimezone,
	setDistributedUptimeEnabled,
	setLanguage,
	setStarPromptOpen,
	setChartType,
	setDashboardCards,
	setDashboardCardsVisibility,
	toggleDashboardCard,
	resetDashboardCards,
	setDashboardCardOrder,
} = uiSlice.actions;
