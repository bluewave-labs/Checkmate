import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import { networkService } from "../../main";
const initialState = {
  isLoading: false,
  monitors: [],
  success: null,
  msg: null,
};

export const createUptimeMonitor = createAsyncThunk(
  "monitors/createMonitor",
  async (data, thunkApi) => {
    try {
      const { authToken, monitor } = data;
      const res = await networkService.createMonitor(authToken, monitor);
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

export const getUptimeMonitorsByUserId = createAsyncThunk(
  "montiors/getMonitorsByUserId",
  async (token, thunkApi) => {
    const user = jwtDecode(token);
    try {
      const res = await networkService.getMonitorsByUserId(
        token,
        user._id,
        25,
        ["http", "ping"],
        null,
        "desc",
        true
      );
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
      const { authToken, monitor } = data;
      const updatedFields = {
        name: monitor.name,
        description: monitor.description,
        interval: monitor.interval,
        notifications: monitor.notifications,
      };
      const res = await networkService.updateMonitor(
        authToken,
        monitor._id,
        updatedFields
      );
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
      const { authToken, monitor } = data;
      const res = await networkService.deleteMonitorById(
        authToken,
        monitor._id
      );
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
      state.monitors = [];
      state.success = null;
      state.msg = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // *****************************************************
      // Monitors by userId
      // *****************************************************

      .addCase(getUptimeMonitorsByUserId.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUptimeMonitorsByUserId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = action.payload.msg;
        state.monitors = action.payload.data;
      })
      .addCase(getUptimeMonitorsByUserId.rejected, (state, action) => {
        state.isLoading = false;
        state.success = false;
        state.msg = action.payload
          ? action.payload.msg
          : "Getting uptime monitors failed";
      })

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
      });
  },
});

export const { setUptimeMonitors, clearUptimeMonitorState } =
  uptimeMonitorsSlice.actions;

export default uptimeMonitorsSlice.reducer;
