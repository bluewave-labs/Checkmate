import { createContext, useContext } from "react";
import { useGet } from "@/Hooks/UseApi";
import { MonitorTypes, type MonitorsWithChecksResponse } from "@/Types/Monitor";
import { REFRESH_INTERVAL_MS } from "./cards";

// One request feeds every monitor-derived card, read from context so adding a
// card costs no extra call. No rowsPerPage: the dashboard summarises the whole
// fleet, and the repository treats its absence as "no limit".
const buildMonitorsUrl = () => {
	const params = new URLSearchParams();
	MonitorTypes.forEach((type) => params.append("type", type));
	return `/monitors/team/with-checks?${params.toString()}`;
};

export const useMonitorsRequest = () =>
	useGet<MonitorsWithChecksResponse>(
		buildMonitorsUrl(),
		{},
		{ refreshInterval: REFRESH_INTERVAL_MS, keepPreviousData: true }
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
