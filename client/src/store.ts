import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/Features/Auth/authSlice";
import uiReducer from "@/Features/UI/uiSlice";
import storage from "redux-persist/lib/storage";
import {
	persistReducer,
	persistStore,
	createTransform,
	PERSIST,
	REHYDRATE,
} from "redux-persist";

const authTransform = createTransform(
	(inboundState: Record<string, unknown>) => {
		const { profileImage, ...rest } = inboundState;
		return rest;
	},
	undefined,
	{ whitelist: ["auth"] }
);

const persistConfig = {
	key: "root",
	storage,
	whitelist: ["auth", "ui"],
	transforms: [authTransform],
};

const rootReducer = combineReducers({
	auth: authReducer,
	ui: uiReducer,
});

// @ts-expect-error - redux-persist types don't align perfectly with redux-toolkit
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [PERSIST, REHYDRATE, "persist/REGISTER"],
			},
		}),
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export const persistor = persistStore(store);
export default store;
