import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type ChartType = "heatmap" | "histogram";

interface UiState {
  language: string;
  mode: string;
  sidebarOpen: boolean;
  timezone: string;
  chartType: ChartType;
}

const initialState: UiState = {
  language: "en",
  mode: "dark",
  sidebarOpen: true,
  timezone: "America/Vancouver",
  chartType: "heatmap",
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
    setChartType: (state, action: PayloadAction<ChartType>) => {
      state.chartType = action.payload;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
  },
});

export const {
  setLanguage,
  setMode,
  setSidebarOpen,
  setTimezone,
  setChartType,
} = uiSlice.actions;
export default uiSlice.reducer;
