import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  language: string;
  mode: string;
  sidebarOpen: boolean;
  timezone: string;
}

const initialState: UiState = {
  language: "en",
  mode: "dark",
  sidebarOpen: true,
  timezone: "America/Vancouver",
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setMode: (state, action: PayloadAction<string>) => {
      state.mode = action.payload;
    },
    setTimezone: (state, action: PayloadAction<string>) => {
      state.timezone = action.payload;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
  },
});

export const { setLanguage, setMode, setSidebarOpen, setTimezone } =
  uiSlice.actions;
export default uiSlice.reducer;
