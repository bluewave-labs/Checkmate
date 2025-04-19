import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { networkService } from "../../main";
const initialState = {
	isLoading: false,
	monitorsSummary: [],
	success: null,
	msg: null,
};

export const createInfrastructureMonitor = createAsyncThunk(
	"infrastructureMonitors/createMonitor",
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

export const checkInfrastructureEndpointResolution = createAsyncThunk(
	"infrastructureMonitors/CheckEndpoint",
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

export const getInfrastructureMonitorById = createAsyncThunk(
	"infrastructureMonitors/getMonitorById",
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

export const getInfrastructureMonitorsByTeamId = createAsyncThunk(
	"infrastructureMonitors/getMonitorsByTeamId",
	async (_, thunkApi) => {
		const user = thunkApi.getState().auth.user;
		try {
			const res = await networkService.getMonitorsAndSummaryByTeamId({
				teamId: user.teamId,
				types: ["hardware"],
				limit: 1,
				rowsPerPage: 0,
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

export const updateInfrastructureMonitor = createAsyncThunk(
	"infrastructureMonitors/updateMonitor",
	async ({ monitorId, monitor }, thunkApi) => {
		try {
			const updatedFields = {
				name: monitor.name,
				description: monitor.description,
				interval: monitor.interval,
				notifications: monitor.notifications,
				thresholds: monitor.thresholds,
				secret: monitor.secret,
			};
			const res = await networkService.updateMonitor({
				monitorId,
				monitor,
				updatedFields,
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

export const deleteInfrastructureMonitor = createAsyncThunk(
	"infrastructureMonitors/deleteMonitor",
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

export const pauseInfrastructureMonitor = createAsyncThunk(
	"infrastructureMonitors/pauseMonitor",
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

export const deleteInfrastructureMonitorChecksByTeamId = createAsyncThunk(
	"infrastructureMonitors/deleteChecksByTeamId",
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

export const deleteAllInfrastructureMonitors = createAsyncThunk(
	"infrastructureMonitors/deleteAllMonitors",
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

const infrastructureMonitorsSlice = createSlice({
	name: "infrastructureMonitors",
	initialState,
	reducers: {
		clearInfrastructureMonitorState: (state) => {
			state.isLoading = false;
			state.monitorsSummary = [];
			state.success = null;
			state.msg = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// *****************************************************
			// Monitors by teamId
			// *****************************************************

			.addCase(getInfrastructureMonitorsByTeamId.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(getInfrastructureMonitorsByTeamId.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.msg;
				state.monitorsSummary = action.payload.data;
			})
			.addCase(getInfrastructureMonitorsByTeamId.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload
					? action.payload.msg
					: "Getting infrastructure monitors failed";
			})

			// *****************************************************
			// Create Monitor
			// *****************************************************
			.addCase(createInfrastructureMonitor.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(createInfrastructureMonitor.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(createInfrastructureMonitor.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload
					? action.payload.msg
					: "Failed to create infrastructure monitor";
			})
			// *****************************************************
			// Resolve Endpoint
			// *****************************************************
			.addCase(checkInfrastructureEndpointResolution.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(checkInfrastructureEndpointResolution.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(checkInfrastructureEndpointResolution.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload
					? action.payload.msg
					: "Failed to check endpoint resolution";
			})
			// *****************************************************
			// Get Monitor By Id
			// *****************************************************
			.addCase(getInfrastructureMonitorById.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(getInfrastructureMonitorById.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(getInfrastructureMonitorById.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload
					? action.payload.msg
					: "Failed to get infrastructure monitor";
			})
			// *****************************************************
			// update Monitor
			// *****************************************************
			.addCase(updateInfrastructureMonitor.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(updateInfrastructureMonitor.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(updateInfrastructureMonitor.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload
					? action.payload.msg
					: "Failed to update infrastructure monitor";
			})

			// *****************************************************
			// Delete Monitor
			// *****************************************************
			.addCase(deleteInfrastructureMonitor.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(deleteInfrastructureMonitor.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(deleteInfrastructureMonitor.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload
					? action.payload.msg
					: "Failed to delete infrastructure monitor";
			})
			// *****************************************************
			// Delete Monitor checks by Team ID
			// *****************************************************
			.addCase(deleteInfrastructureMonitorChecksByTeamId.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(deleteInfrastructureMonitorChecksByTeamId.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(deleteInfrastructureMonitorChecksByTeamId.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload
					? action.payload.msg
					: "Failed to delete monitor checks";
			})
			// *****************************************************
			// Pause Monitor
			// *****************************************************
			.addCase(pauseInfrastructureMonitor.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(pauseInfrastructureMonitor.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(pauseInfrastructureMonitor.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload
					? action.payload.msg
					: "Failed to pause infrastructure monitor";
			})
			// *****************************************************
			// Delete all Monitors
			// *****************************************************
			.addCase(deleteAllInfrastructureMonitors.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(deleteAllInfrastructureMonitors.fulfilled, (state, action) => {
				state.isLoading = false;
				state.success = action.payload.success;
				state.msg = action.payload.msg;
			})
			.addCase(deleteAllInfrastructureMonitors.rejected, (state, action) => {
				state.isLoading = false;
				state.success = false;
				state.msg = action.payload ? action.payload.msg : "Failed to delete all monitors";
			});
	},
});

export const { setInfrastructureMonitors, clearInfrastructureMonitorState } =
	infrastructureMonitorsSlice.actions;

export default infrastructureMonitorsSlice.reducer;
