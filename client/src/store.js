import { configureStore, combineReducers } from "@reduxjs/toolkit";

import infrastructureMonitorsReducer from "./Features/InfrastructureMonitors/infrastructureMonitorsSlice";
import pageSpeedMonitorReducer from "./Features/PageSpeedMonitor/pageSpeedMonitorSlice";
import authReducer from "./Features/Auth/authSlice";
import uiReducer from "./Features/UI/uiSlice";
import settingsReducer from "./Features/Settings/settingsSlice";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore, createTransform } from "redux-persist";

const authTransform = createTransform(
	(inboundState) => {
		const { profileImage, ...rest } = inboundState;
		return rest;
	},
	// No transformation on rehydration
	null,
	// Only applies to auth
	{ whitelist: ["auth"] }
);

const persistConfig = {
	key: "root",
	storage,
	whitelist: ["auth", "pageSpeed", "ui", "settings"],
	transforms: [authTransform],
};

const rootReducer = combineReducers({
	infrastructureMonitors: infrastructureMonitorsReducer,
	auth: authReducer,
	pageSpeedMonitors: pageSpeedMonitorReducer,
	ui: uiReducer,
	settings: settingsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ["persist/PERSIST", "persist/REHYDRATE", "persist/REGISTER"],
			},
		}),
});

export const persistor = persistStore(store);
export default store;
