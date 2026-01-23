import { useGet } from "@/Hooks/UseApi";
import { MonitorBasePageWithStates } from "@/Components/v2/design-elements";
import type { Monitor, MonitorType, MonitorsWithChecksResponse } from "@/Types/Monitor";
import { FilterControls } from "@/Components/v2/monitors";
import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/Types/state";

const UptimeMonitorsPage = () => {
	// Redux state
	const rowsPerPage = useSelector((state: RootState) => state.ui.monitors.rowsPerPage);

	// Local state
	const [selectedTypes, setSelectedTypes] = useState<MonitorType[]>([]);
	const [selectedStatus, setSelectedStatus] = useState<string>("");
	const [selectedState, setSelectedState] = useState<string>("");
	const [page, setPage] = useState(0);
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<
		{ field: string; order: "asc" | "desc" } | undefined
	>();

	// Build URL for monitors with checks
	const monitorsWithChecksUrl = useMemo(() => {
		const params = new URLSearchParams();
		const types =
			selectedTypes.length > 0 ? selectedTypes : ["http", "ping", "docker", "port"];
		types.forEach((type) => params.append("type", type));
		params.append("limit", "25");
		if (page) params.append("page", String(page));
		if (rowsPerPage) params.append("rowsPerPage", String(rowsPerPage));
		if (search) params.append("filter", search);
		if (sort?.field) params.append("field", sort.field);
		if (sort?.order) params.append("order", sort.order);
		return `/monitors/team/with-checks?${params.toString()}`;
	}, [selectedTypes, page, rowsPerPage, search, sort]);

	// Data fetching
	const {
		data: monitors,
		isLoading,
		error,
	} = useGet<Monitor[]>("/monitors/team?type=http&type=ping&type=port&type=docker");

	const {
		data: monitorsWithChecksData,
		isLoading: monitorsWithChecksLoading,
		error: monitorsWithChecksError,
	} = useGet<MonitorsWithChecksResponse>(monitorsWithChecksUrl);

	const { monitors: monitorsWithChecks, summary, count } = monitorsWithChecksData ?? {};

	return (
		<MonitorBasePageWithStates
			loading={isLoading || monitorsWithChecksLoading}
			error={error || monitorsWithChecksError}
			items={monitors || []}
			page="uptime"
			actionLink="/uptime/create"
		>
			<FilterControls
				selectedTypes={selectedTypes}
				setSelectedTypes={setSelectedTypes}
				selectedStatus={selectedStatus}
				setSelectedStatus={setSelectedStatus}
				selectedState={selectedState}
				setSelectedState={setSelectedState}
			/>
			<pre>{JSON.stringify(monitors, null, 2)}</pre>
		</MonitorBasePageWithStates>
	);
};

export default UptimeMonitorsPage;
