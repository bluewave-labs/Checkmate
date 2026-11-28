import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/Types/User";

interface AuthState {
	isLoading: boolean;
	authToken: string;
	refreshToken: string;
	user: User | null;
	success: boolean | null;
	msg: string | null;
}

const initialState: AuthState = {
	isLoading: false,
	authToken: "",
	refreshToken: "",
	user: null,
	success: null,
	msg: null,
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		clearAuthState: (state) => {
			state.authToken = "";
			state.refreshToken = "";
			state.user = null;
			state.isLoading = false;
			state.success = true;
			state.msg = "Logged out successfully";
		},
		setAuthState: (
			state,
			action: PayloadAction<{
				success: boolean;
				msg: string;
				data: { token: string; refreshToken?: string; user: User };
			}>
		) => {
			state.isLoading = false;
			state.success = action.payload.success;
			state.msg = action.payload.msg;
			state.authToken = action.payload.data.token;
			state.refreshToken = action.payload.data.refreshToken ?? "";
			state.user = action.payload.data.user;
		},
		setTokens: (
			state,
			action: PayloadAction<{ token: string; refreshToken: string; user: User }>
		) => {
			state.authToken = action.payload.token;
			state.refreshToken = action.payload.refreshToken;
			state.user = action.payload.user;
		},
		setUser: (state, action: PayloadAction<User>) => {
			state.user = action.payload;
		},
	},
});

export type { AuthState };
export default authSlice.reducer;
export const { clearAuthState, setAuthState, setTokens, setUser } = authSlice.actions;
