import { ControlsFilter } from "@/Components/v2/monitors";
import {
	MonitorBasePageWithStates,
	UpStatusBox,
	DownStatusBox,
	PausedStatusBox,
} from "@/Components/v2/design-elements";
import { TextField } from "@/Components/v2/inputs";
import Stack from "@mui/material/Stack";
import { MonitorTable } from "@/Pages/Uptime/Monitors/Components/UptimeMonitorsTable";
import { useTranslation } from "react-i18next";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useGet } from "@/Hooks/UseApi";
import type { Monitor, MonitorType, MonitorsWithChecksResponse } from "@/Types/Monitor";
import { useState, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setRowsPerPage } from "@/Features/UI/uiSlice.js";

import type { RootState } from "@/Types/state";
import { useTheme } from "@mui/material";

const UptimeMonitorsPage = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const dispatch = useDispatch();

	// Redux state
	const rowsPerPage = useSelector(
		(state: RootState) => state.ui?.monitors?.rowsPerPage ?? 10
	);

	// Local state
	const [selectedTypes, setSelectedTypes] = useState<MonitorType[]>([]);
	const [selectedStatus, setSelectedStatus] = useState<string>("");
	const [selectedState, setSelectedState] = useState<string>("");
	const [page, setPage] = useState<number>(0);
	const [search, setSearch] = useState<string>("");
	const [sortField, setSortField] = useState<string>("");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

	// Convert filter selections to API filter values
	// Status: "up" -> true, "down" -> false
	// State: "active" -> true, "paused" -> false
	const toFilterStatus = useMemo(() => {
		if (selectedStatus === "up") return "true";
		if (selectedStatus === "down") return "false";
		return undefined;
	}, [selectedStatus]);

	const toFilterActive = useMemo(() => {
		if (selectedState === "active") return "true";
		if (selectedState === "paused") return "false";
		return undefined;
	}, [selectedState]);

	// Determine field and filter for the API request
	// Priority: status > isActive > search > sort
	const filterLookup = new Map<string | undefined, string>([
		[toFilterStatus, "status"],
		[toFilterActive, "isActive"],
	]);
	const activeFilter = [...filterLookup].find(([key]) => key !== undefined);
	const field = activeFilter?.[1] || (search ? "name" : sortField || undefined);
	const filter = activeFilter?.[0] || search;

	// Default to all types when none selected
	const effectiveTypes =
		selectedTypes.length > 0 ? selectedTypes : ["http", "ping", "docker", "port"];

	// Build URL for monitors with checks
	const monitorsWithChecksUrl = useMemo(() => {
		const params = new URLSearchParams();
		effectiveTypes.forEach((type) => params.append("type", type));
		params.append("limit", "25");
		if (page !== undefined) params.append("page", String(page));
		if (rowsPerPage) params.append("rowsPerPage", String(rowsPerPage));
		if (filter) params.append("filter", filter);
		if (field) params.append("field", field);
		if (sortOrder) params.append("order", sortOrder);
		return `/monitors/team/with-checks?${params.toString()}`;
	}, [effectiveTypes, page, rowsPerPage, filter, field, sortOrder]);

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
		refetch,
	} = useGet<MonitorsWithChecksResponse>(
		monitorsWithChecksUrl,
		{},
		{ refreshInterval: 5000 }
	);

	const { monitors: monitorsWithChecks, summary, count } = monitorsWithChecksData ?? {};

	// Handlers
	const handleClearFilters = useCallback(() => {
		setSelectedTypes([]);
		setSelectedStatus("");
		setSelectedState("");
		setSearch("");
	}, []);

	return (
		<MonitorBasePageWithStates
			loading={isLoading || monitorsWithChecksLoading}
			error={error || monitorsWithChecksError}
			items={monitors || []}
			page="uptime"
			actionLink="/uptime/create"
		>
			<Stack
				direction={isSmall ? "column" : "row"}
				gap={theme.spacing(8)}
			>
				<UpStatusBox n={summary?.upMonitors || 0} />
				<DownStatusBox n={summary?.downMonitors || 0} />
				<PausedStatusBox n={summary?.pausedMonitors || 0} />
			</Stack>

			<Stack
				direction={isSmall ? "column" : "row"}
				justifyContent={isSmall ? "flex-start" : "space-between"}
				gap={theme.spacing(4)}
			>
				<ControlsFilter
					selectedTypes={selectedTypes}
					setSelectedTypes={setSelectedTypes}
					selectedStatus={selectedStatus}
					setSelectedStatus={setSelectedStatus}
					selectedState={selectedState}
					setSelectedState={setSelectedState}
					onClearFilters={handleClearFilters}
				/>
				<TextField
					placeholder={t("pages.uptime.filters.search.placeholder")}
					value={search}
					onChange={(event) => {
						setSearch(event.target.value);
					}}
				/>
			</Stack>
			<MonitorTable
				monitors={monitorsWithChecks || []}
				refetch={refetch}
				count={count || 0}
				page={page}
				setPage={setPage}
				rowsPerPage={rowsPerPage}
				sortField={sortField}
				setSortField={setSortField}
				sortOrder={sortOrder}
				setSortOrder={setSortOrder}
				setRowsPerPage={(e: any) => {
					dispatch(
						setRowsPerPage({
							value: parseInt(e.target.value, 10),
							table: "monitors",
						})
					);
					setPage(0);
				}}
			/>
		</MonitorBasePageWithStates>
	);
};

export default UptimeMonitorsPage;
