import { createSlice } from "@reduxjs/toolkit";

const initialState = {
	isAuthenticated: false,
};

const v2AuthSlice = createSlice({
	name: "v2Auth",
	initialState,
	reducers: {
		setIsAuthenticated: (state, action) => {
			const { authenticated } = action.payload;
			state.isAuthenticated = authenticated;
		},
	},
});

export default v2AuthSlice.reducer;
export const { setIsAuthenticated } = v2AuthSlice.actions;
