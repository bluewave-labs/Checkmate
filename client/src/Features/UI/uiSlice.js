import { createSlice } from "@reduxjs/toolkit";

// Detect initial color mode preference
const initialMode =
    window?.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";

// Initial UI state
const initialState = {
    monitors: { rowsPerPage: 10 },
    team: { rowsPerPage: 5 },
    maintenance: { rowsPerPage: 5 },
    infrastructure: { rowsPerPage: 5 },
    sidebar: { collapsed: false },
    mode: initialMode,
    showURL: false,
    greeting: { index: 0, lastUpdate: null },
    timezone: "America/Toronto",
    distributedUptimeEnabled: false,
    language: "en",
    starPromptOpen: true,
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        // Enable/disable distributed uptime
        setDistributedUptimeEnabled(state, action) {
            state.distributedUptimeEnabled = !!action.payload;
        },
        // Set rows per page for a given table
        setRowsPerPage(state, action) {
            const { table, value } = action.payload;
            if (state[table] && typeof value === "number") {
                state[table].rowsPerPage = value;
            }
        },
        // Toggle sidebar collapsed state
        toggleSidebar(state) {
            state.sidebar.collapsed = !state.sidebar.collapsed;
        },
        // Set UI mode (dark/light)
        setMode(state, action) {
            state.mode = action.payload;
        },
        // Show or hide URL
        setShowURL(state, action) {
            state.showURL = !!action.payload;
        },
        // Update greeting info
        setGreeting(state, action) {
            const { index, lastUpdate } = action.payload;
            state.greeting.index = index;
            state.greeting.lastUpdate = lastUpdate;
        },
        // Set timezone
        setTimezone(state, action) {
            state.timezone = action.payload?.timezone || state.timezone;
        },
        // Set language
        setLanguage(state, action) {
            state.language = action.payload;
        },
        // Open/close star prompt
        setStarPromptOpen(state, action) {
            state.starPromptOpen = !!action.payload;
        },
    },
});

export default uiSlice.reducer;
export const {
    setRowsPerPage,
    toggleSidebar,
    setMode,
    setShowURL,
    setGreeting,
    setTimezone,
    setDistributedUptimeEnabled,
    setLanguage,
    setStarPromptOpen,
} = uiSlice.actions;
