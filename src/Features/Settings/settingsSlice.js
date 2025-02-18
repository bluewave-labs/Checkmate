import { networkService } from "../../main";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
	isLoading: false,
	apiBaseUrl: "",
	logLevel: "debug",
};

export const getAppSettings = createAsyncThunk(
	"settings/getSettings",
	async (data, thunkApi) => {
		try {
			const res = await networkService.getAppSettings({
				authToken: data.authToken,
			});
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
	async ({ settings, authToken }, thunkApi) => {
		networkService.setBaseUrl(settings.apiBaseUrl);
		try {
			const parsedSettings = {
				apiBaseUrl: settings.apiBaseUrl,
				logLevel: settings.logLevel,
				clientHost: settings.clientHost,
				jwtSecret: settings.jwtSecret,
				dbType: settings.dbType,
				dbConnectionString: settings.dbConnectionString,
				redisHost: settings.redisHost,
				redisPort: settings.redisPort,
				jwtTTL: settings.jwtTTL,
				pagespeedApiKey: settings.pagespeedApiKey,
				systemEmailHost: settings.systemEmailHost,
				systemEmailPort: settings.systemEmailPort,
				systemEmailAddress: settings.systemEmailAddress,
				systemEmailPassword: settings.systemEmailPassword,
			};
			const res = await networkService.updateAppSettings({
				settings: parsedSettings,
				authToken,
			});
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
