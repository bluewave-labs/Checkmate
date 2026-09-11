import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/Features/Auth/authSlice";
import uiReducer from "@/Features/UI/uiSlice";
import storage from "redux-persist/lib/storage";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";
import {
	persistReducer,
	persistStore,
	createTransform,
	createMigrate,
	PERSIST,
	REHYDRATE,
} from "redux-persist";
import {
	defaultVisibleCards,
	DASHBOARD_CARD_IDS,
} from "@/Pages/Dashboard/dashboardCards";

const authTransform = createTransform(
	(inboundState: Record<string, unknown>) => {
		const { profileImage, ...rest } = inboundState;
		return rest;
	},
	undefined,
	{ whitelist: ["auth"] }
);

const migrations = {
	0: (state: any) => ({
		...state,
		ui: {
			...state?.ui,
			dashboardCards: state?.ui?.dashboardCards ?? { ...defaultVisibleCards },
		},
	}),
	1: (state: any) => {
		const cards = state?.ui?.dashboardCards;
		const hasAnyVisible = cards && Object.values(cards).some((v) => v);
		return {
			...state,
			ui: {
				...state?.ui,
				dashboardCards: hasAnyVisible ? cards : { ...defaultVisibleCards },
			},
		};
	},
	2: (state: any) => {
		const cards = state?.ui?.dashboardCards ?? { ...defaultVisibleCards };
		const stubCards = DASHBOARD_CARD_IDS.filter((id) => !defaultVisibleCards[id]);
		const resetCards = { ...cards };
		stubCards.forEach((id) => {
			resetCards[id] = false;
		});
		return { ...state, ui: { ...state?.ui, dashboardCards: resetCards } };
	},
};

const persistConfig = {
	key: "root",
	version: 2,
	storage,
	whitelist: ["auth", "ui"],
	transforms: [authTransform],
	stateReconciler: autoMergeLevel2,
	migrate: createMigrate(migrations, { debug: false }),
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
