import { networkService } from "../../main";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
	isLoading: false,
	apiBaseUrl: "",
	logLevel: "debug",
	language: "gb",
};

export const getAppSettings = createAsyncThunk(
	"settings/getSettings",
	async (data, thunkApi) => {
		try {
			const res = await networkService.getAppSettings();
			return res.data;
		} catch (error) {
			if (error.response.data) {
				return thunkApi.rejectWithValue(error.response.data);
			}
			const payload = {
				status: false,
				msg: error.message ? error.message : "Unknown error",
			};
			return thunkApi.rejectWithValue(payload);
		}
	}
);

export const updateAppSettings = createAsyncThunk(
	"settings/updateSettings",
	async ({ settings }, thunkApi) => {
		try {
			const parsedSettings = {
				language: settings.language,
			};
			const res = await networkService.updateAppSettings({ settings: parsedSettings });
			return res.data;
		} catch (error) {
			if (error.response && error.response.data) {
				return thunkApi.rejectWithValue(error.response.data);
			}
			const payload = {
				status: false,
				msg: error.message ? error.message : "Unknown error",
			};
			return thunkApi.rejectWithValue(payload);
		}
	}
);

const handleGetSettingsFulfilled = (state, action) => {
	state.isLoading = false;
	state.success = action.payload.success;
	state.msg = action.payload.msg;
	state.apiBaseUrl = action.payload.data.apiBaseUrl;
	state.logLevel = action.payload.data.logLevel;
	state.language = action.payload.data.language;
};
const handleGetSettingsRejected = (state, action) => {
	state.isLoading = false;
	state.success = false;
	state.msg = action.payload ? action.payload.msg : "Failed to get settings.";
};
const handleUpdateSettingsFulfilled = (state, action) => {
	state.isLoading = false;
	state.success = action.payload.success;
	state.msg = action.payload.msg;
	state.apiBaseUrl = action.payload.data.apiBaseUrl;
	state.logLevel = action.payload.data.logLevel;
};
const handleUpdateSettingsRejected = (state, action) => {
	state.isLoading = false;
	state.success = false;
	state.msg = action.payload ? action.payload.msg : "Failed to update settings.";
};

const settingsSlice = createSlice({
	name: "settings",
	initialState,
	extraReducers: (builder) => {
		builder
			.addCase(getAppSettings.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(getAppSettings.fulfilled, handleGetSettingsFulfilled)
			.addCase(getAppSettings.rejected, handleGetSettingsRejected);

		builder
			.addCase(updateAppSettings.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(updateAppSettings.fulfilled, handleUpdateSettingsFulfilled)
			.addCase(updateAppSettings.rejected, handleUpdateSettingsRejected);
	},
});

export default settingsSlice.reducer;
