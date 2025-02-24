import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { networkService } from "../../main";
const initialState = {
	isLoading: false,
	monitorsSummary: [],
	success: null,
	msg: null,
};

export const createUptimeMonitor = createAsyncThunk(
	"monitors/createMonitor",
	async (data, thunkApi) => {
		try {
			const { monitor } = data;
			const res = await networkService.createMonitor({ monitor: monitor });
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

export const checkEndpointResolution = createAsyncThunk(
	"monitors/checkEndpoint",
	async (data, thunkApi) => {
		try {
			const { monitorURL } = data;
			const res = await networkService.checkEndpointResolution({
				monitorURL: monitorURL,
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

export const getUptimeMonitorById = createAsyncThunk(
	"monitors/getMonitorById",
	async (data, thunkApi) => {
		try {
			const { monitorId } = data;
			const res = await networkService.getMonitorById({ monitorId: monitorId });
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

export const updateUptimeMonitor = createAsyncThunk(
	"monitors/updateMonitor",
	async (data, thunkApi) => {
		try {
			const { monitor } = data;
			const updatedFields = {
				name: monitor.name,
				description: monitor.description,
				interval: monitor.interval,
				notifications: monitor.notifications,
				matchMethod: monitor.matchMethod,
				expectedValue: monitor.expectedValue,
				jsonPath: monitor.jsonPath,
			};
			const res = await networkService.updateMonitor({
				monitorId: monitor._id,
				monitor,
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

export const deleteUptimeMonitor = createAsyncThunk(
	"monitors/deleteMonitor",
	async (data, thunkApi) => {
		try {
			const { monitor } = data;
			const res = await networkService.deleteMonitorById({ monitorId: monitor._id });
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

export const pauseUptimeMonitor = createAsyncThunk(
	"monitors/pauseMonitor",
	async (data, thunkApi) => {
		try {
			const { monitorId } = data;
			const res = await networkService.pauseMonitorById({ monitorId: monitorId });
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

export const deleteMonitorChecksByTeamId = createAsyncThunk(
	"monitors/deleteChecksByTeamId",
	async (data, thunkApi) => {
		try {
			const { teamId } = data;
			const res = await networkService.deleteChecksByTeamId({ teamId: teamId });
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
export const addDemoMonitors = createAsyncThunk(
	"monitors/addDemoMonitors",
	async (data, thunkApi) => {
		try {
			const res = await networkService.addDemoMonitors();
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

export const deleteAllMonitors = createAsyncThunk(
	"monitors/deleteAllMonitors",
	async (data, thunkApi) => {
		try {
			const res = await networkService.deleteAllMonitors();
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

const uptimeMonitorsSlice = createSlice({
	name: "uptimeMonitors",
	initialState,
	reducers: {
		clearUptimeMonitorState: (state) => {
			state.isLoading = false;
			state.monitorsSummary = [];
			state.success = null;
			state.msg = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// *****************************************************
			// Create Monitor
			// *****************************************************
			.addCase(createUptimeMonitor.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(createUptimeMonitor.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(createUptimeMonitor.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload
					? action.payload.msg
					: "Failed to create uptime monitor";
			})
			// *****************************************************
			// Resolve Endpoint
			// *****************************************************
			.addCase(checkEndpointResolution.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(checkEndpointResolution.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(checkEndpointResolution.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload
					? action.payload.msg
					: "Failed to check endpoint resolution";
			})
			// *****************************************************
			// Get Monitor By Id
			// *****************************************************
			.addCase(getUptimeMonitorById.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(getUptimeMonitorById.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(getUptimeMonitorById.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload ? action.payload.msg : "Failed to get uptime monitor";
			})
			// *****************************************************
			// update Monitor
			// *****************************************************
			.addCase(updateUptimeMonitor.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(updateUptimeMonitor.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(updateUptimeMonitor.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload
					? action.payload.msg
					: "Failed to update uptime monitor";
			})

			// *****************************************************
			// Delete Monitor
			// *****************************************************
			.addCase(deleteUptimeMonitor.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(deleteUptimeMonitor.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(deleteUptimeMonitor.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload
					? action.payload.msg
					: "Failed to delete uptime monitor";
			})
			// *****************************************************
			// Delete Monitor checks by Team ID
			// *****************************************************
			.addCase(deleteMonitorChecksByTeamId.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(deleteMonitorChecksByTeamId.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(deleteMonitorChecksByTeamId.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload
					? action.payload.msg
					: "Failed to delete monitor checks";
			})
			// *****************************************************
			// Pause Monitor
			// *****************************************************
			.addCase(pauseUptimeMonitor.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(pauseUptimeMonitor.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(pauseUptimeMonitor.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload
					? action.payload.msg
					: "Failed to pause uptime monitor";
			})
			// *****************************************************
			// Add Demo Monitors
			// *****************************************************
			.addCase(addDemoMonitors.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(addDemoMonitors.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(addDemoMonitors.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload
					? action.payload.msg
					: "Failed to add demo uptime monitors";
			})
			// *****************************************************
			// Delete all Monitors
			// *****************************************************
			.addCase(deleteAllMonitors.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(deleteAllMonitors.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(deleteAllMonitors.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload ? action.payload.msg : "Failed to delete all monitors";
			});
	},
});

export const { setUptimeMonitors, clearUptimeMonitorState } = uptimeMonitorsSlice.actions;

export default uptimeMonitorsSlice.reducer;
