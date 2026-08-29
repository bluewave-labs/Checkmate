import { createContext, useContext } from "react";
import { useGet } from "@/Hooks/UseApi";
import {
	MAX_RECENT_CHECKS,
	MonitorTypes,
	type MonitorsWithChecksResponse,
} from "@/Types/Monitor";

const REFRESH_INTERVAL = 30000;

// One request feeds every monitor-derived card. Cards read it from context so
// adding a monitor card costs no extra call.
const buildMonitorsUrl = () => {
	const params = new URLSearchParams();
	MonitorTypes.forEach((type) => params.append("type", type));
	// No rowsPerPage: the repository treats 0 as "no limit", so every monitor
	// comes back. The dashboard summarises the whole fleet, it never pages.
	params.append("limit", String(MAX_RECENT_CHECKS));
	return `/monitors/team/with-checks?${params.toString()}`;
};

export const useMonitorsRequest = () =>
	useGet<MonitorsWithChecksResponse>(
		buildMonitorsUrl(),
		{},
		{ refreshInterval: REFRESH_INTERVAL, keepPreviousData: true }
	);

export type MonitorsRequest = ReturnType<typeof useMonitorsRequest>;

export const MonitorsContext = createContext<MonitorsRequest | null>(null);

export const useMonitors = (): MonitorsRequest => {
	const context = useContext(MonitorsContext);
	if (!context) {
		throw new Error("useMonitors must be used inside the dashboard's MonitorsContext");
	}
	return context;
};
