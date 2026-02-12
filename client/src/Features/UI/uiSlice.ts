import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type ThemeMode = "light" | "dark";
type ChartType = "histogram" | "line";
type TableName = "monitors" | "team" | "maintenance" | "infrastructure" | "logs";

interface TableState {
	rowsPerPage: number;
}

interface SidebarState {
	collapsed: boolean;
}

interface GreetingState {
	index: number;
	lastUpdate: string | null;
}

interface UIState {
	monitors: TableState;
	team: TableState;
	maintenance: TableState;
	infrastructure: TableState;
	logs: TableState;
	sidebar: SidebarState;
	mode: ThemeMode;
	showURL: boolean;
	greeting: GreetingState;
	timezone: string;
	distributedUptimeEnabled: boolean;
	language: string;
	starPromptOpen: boolean;
	chartType: ChartType;
}

const initialMode: ThemeMode = window?.matchMedia?.("(prefers-color-scheme: dark)")
	?.matches
	? "dark"
	: "light";

const initialState: UIState = {
	monitors: {
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
	logs: {
		rowsPerPage: 15,
	},
	sidebar: {
		collapsed: false,
	},
	mode: initialMode,
	showURL: false,
	greeting: { index: 0, lastUpdate: null },
	timezone: "America/Toronto",
	distributedUptimeEnabled: false,
	language: "en",
	starPromptOpen: true,
	chartType: "histogram",
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
		setGreeting: (
			state,
			action: PayloadAction<{ index: number; lastUpdate: string | null }>
		) => {
			state.greeting.index = action.payload.index;
			state.greeting.lastUpdate = action.payload.lastUpdate;
		},
		setTimezone: (state, action: PayloadAction<{ timezone: string }>) => {
			state.timezone = action.payload.timezone;
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
	setGreeting,
	setTimezone,
	setDistributedUptimeEnabled,
	setLanguage,
	setStarPromptOpen,
	setChartType,
} = uiSlice.actions;
