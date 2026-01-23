export interface AuthState {
	isLoading: boolean;
	authToken: string;
	user: string;
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
}

export interface RootState {
	auth: AuthState;
	ui: UIState;
}
