import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { IUser } from "@/types/user";
interface AuthState {
  isAuthenticated: boolean;
  user: IUser | null;
  selectedTeamId: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  selectedTeamId: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setUser: (state, action: PayloadAction<IUser | null>) => {
      state.user = action.payload;
    },
    setSelectedTeamId: (state, action: PayloadAction<string | null>) => {
      state.selectedTeamId = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.selectedTeamId = null;
    },
  },
});

export const { setAuthenticated, setUser, setSelectedTeamId, logout } =
  authSlice.actions;
export default authSlice.reducer;
