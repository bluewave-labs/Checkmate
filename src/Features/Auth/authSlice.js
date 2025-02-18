import { networkService } from "../../main";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const initialState = {
	isLoading: false,
	authToken: "",
	user: "",
	success: null,
	msg: null,
};

export const register = createAsyncThunk("auth/register", async (form, thunkApi) => {
	try {
		const res = await networkService.registerUser(form);
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
});

export const login = createAsyncThunk("auth/login", async (form, thunkApi) => {
	try {
		const res = await networkService.loginUser(form);
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
});

export const update = createAsyncThunk("auth/update", async (data, thunkApi) => {
	const { authToken: token, localData: form } = data;
	const user = jwtDecode(token);
	try {
		const fd = new FormData();
		form.firstName && fd.append("firstName", form.firstName);
		form.lastName && fd.append("lastName", form.lastName);
		form.password && fd.append("password", form.password);
		form.newPassword && fd.append("newPassword", form.newPassword);
		if (form.file && form.file !== "") {
			const imageResult = await axios.get(form.file, {
				responseType: "blob",
			});
			fd.append("profileImage", imageResult.data);
		}
		form.deleteProfileImage && fd.append("deleteProfileImage", form.deleteProfileImage);

		const res = await networkService.updateUser({
			authToken: token,
			userId: user._id,
			form: fd,
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
});

export const deleteUser = createAsyncThunk("auth/delete", async (data, thunkApi) => {
	const user = jwtDecode(data);

	try {
		const res = await networkService.deleteUser({
			authToken: data,
			userId: user._id,
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
});

export const forgotPassword = createAsyncThunk(
	"auth/forgotPassword",
	async (form, thunkApi) => {
		try {
			const res = await networkService.forgotPassword(form);
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

export const setNewPassword = createAsyncThunk(
	"auth/setNewPassword",
	async (data, thunkApi) => {
		const { token, form } = data;
		try {
			await networkService.validateRecoveryToken({ recoveryToken: token });
			const res = await networkService.setNewPassword({
				recoveryToken: token,
				form: form,
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

const handleAuthFulfilled = (state, action) => {
	state.isLoading = false;
	state.success = action.payload.success;
	state.msg = action.payload.msg;
	state.authToken = action.payload.data.token;
	state.user = action.payload.data.user;
};
const handleAuthRejected = (state, action) => {
	state.isLoading = false;
	state.success = false;
	state.msg = action.payload ? action.payload.msg : "Failed to login or register";
};
const handleUpdateFulfilled = (state, action) => {
	state.isLoading = false;
	state.success = action.payload.success;
	state.msg = action.payload.msg;
	state.user = action.payload.data;
};
const handleUpdateRejected = (state, action) => {
	state.isLoading = false;
	state.success = false;
	state.msg = action.payload ? action.payload.msg : "Failed to update profile data.";
};
const handleDeleteFulfilled = (state, action) => {
	state.isLoading = false;
	state.success = action.payload.success;
	state.msg = action.payload.msg;
};
const handleDeleteRejected = (state, action) => {
	state.isLoading = false;
	state.success = false;
	state.msg = action.payload ? action.payload.msg : "Failed to delete account.";
};
const handleForgotFulfilled = (state, action) => {
	state.isLoading = false;
	state.success = action.payload.success;
	state.msg = action.payload.msg;
};
const handleForgotRejected = (state, action) => {
	state.isLoading = false;
	state.success = false;
	state.msg = action.payload ? action.payload.msg : "Failed to send reset instructions.";
};
const handleNewPasswordRejected = (state, action) => {
	state.isLoading = false;
	state.success = false;
	state.msg = action.payload ? action.payload.msg : "Failed to reset password.";
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		clearAuthState: (state) => {
			state.authToken = "";
			state.user = "";
			state.isLoading = false;
			state.success = true;
			state.msg = "Logged out successfully";
		},
	},
	extraReducers: (builder) => {
		// Register thunk
		builder
			.addCase(register.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(register.fulfilled, handleAuthFulfilled)
			.addCase(register.rejected, handleAuthRejected);

		// Login thunk
		builder
			.addCase(login.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(login.fulfilled, handleAuthFulfilled)
			.addCase(login.rejected, handleAuthRejected);

		// Update thunk
		builder
			.addCase(update.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(update.fulfilled, handleUpdateFulfilled)
			.addCase(update.rejected, handleUpdateRejected);

		// Delete thunk
		builder
			.addCase(deleteUser.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(deleteUser.fulfilled, handleDeleteFulfilled)
			.addCase(deleteUser.rejected, handleDeleteRejected);

		// Forgot password thunk
		builder
			.addCase(forgotPassword.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(forgotPassword.fulfilled, handleForgotFulfilled)
			.addCase(forgotPassword.rejected, handleForgotRejected);

		// Set new password thunk
		builder
			.addCase(setNewPassword.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(setNewPassword.fulfilled, handleAuthFulfilled)
			.addCase(setNewPassword.rejected, handleNewPasswordRejected);
	},
});

export default authSlice.reducer;
export const { clearAuthState } = authSlice.actions;
