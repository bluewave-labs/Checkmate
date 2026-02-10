import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/Types/User";

interface AuthState {
	isLoading: boolean;
	authToken: string;
	user: User | null;
	success: boolean | null;
	msg: string | null;
}

const initialState: AuthState = {
	isLoading: false,
	authToken: "",
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
				data: { token: string; user: User };
			}>
		) => {
			state.isLoading = false;
			state.success = action.payload.success;
			state.msg = action.payload.msg;
			state.authToken = action.payload.data.token;
			state.user = action.payload.data.user;
		},
		setUser: (state, action: PayloadAction<User>) => {
			state.user = action.payload;
		},
	},
});

export type { AuthState };
export default authSlice.reducer;
export const { clearAuthState, setAuthState, setUser } = authSlice.actions;
