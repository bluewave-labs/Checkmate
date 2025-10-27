import { configureStore, combineReducers } from "@reduxjs/toolkit";

import authReducer from "./Features/Auth/authSlice";
import v2AuthReducer from "./Features/Auth/v2AuthSlice";
import uiReducer from "./Features/UI/uiSlice";
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
	whitelist: ["auth", "v2Auth", "ui"],
	transforms: [authTransform],
};

const rootReducer = combineReducers({
	auth: authReducer,
	v2Auth: v2AuthReducer,
	ui: uiReducer,
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
