import { createContext, useContext } from "react";
import { useGet } from "@/Hooks/UseApi";
import { MonitorTypes, type MonitorsWithChecksResponse } from "@/Types/Monitor";

const REFRESH_INTERVAL = 30000;

// One request feeds every monitor-derived card. Cards read it from context so
// adding a monitor card costs no extra call.
//
// No rowsPerPage: the repository treats 0 as "no limit", so every monitor comes
// back. The dashboard summarises the whole fleet, it never pages. `limit` is
// deliberately not sent — findByTeamIdWithStats derives its page size from
// rowsPerPage alone and never reads it, so passing it would only imply a
// recent-check truncation that is not actually in effect.
const buildMonitorsUrl = () => {
	const params = new URLSearchParams();
	MonitorTypes.forEach((type) => params.append("type", type));
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
