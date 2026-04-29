import { ControlsFilter, HeaderMonitorsSummary } from "@/Components/monitors";
import { MonitorBasePageWithStates } from "@/Components/design-elements";
import { TextField, Dialog } from "@/Components/inputs";
import Stack from "@mui/material/Stack";
import { MonitorTable } from "@/Pages/Uptime/Monitors/Components/UptimeMonitorsTable";
import { HeaderCreate } from "@/Components/common";

import { useTranslation } from "react-i18next";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useGet, useDelete } from "@/Hooks/UseApi";
import type { Monitor, MonitorType, MonitorsWithChecksResponse } from "@/Types/Monitor";
import { useState, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setRowsPerPage } from "@/Features/UI/uiSlice.js";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import type { RootState } from "@/Types/state";
import { useTheme } from "@mui/material";
import useDebounce from "@/Hooks/useDebounce";

const UptimeMonitorsPage = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const dispatch = useDispatch();
	const isAdmin = useIsAdmin();
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
	const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
	const isDialogOpen = Boolean(selectedMonitor);

	const debouncedSearch = useDebounce<string>(search, 300);

	// Convert filter selections to API filter values
	// Status: pass "up"/"down" directly to the API
	// State: "active" -> true, "paused" -> false
	const toFilterStatus = useMemo(() => {
		if (selectedStatus === "up") return "up";
		if (selectedStatus === "down") return "down";
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
	const field = activeFilter?.[1] || (debouncedSearch ? "name" : sortField || undefined);
	const filter = activeFilter?.[0] || debouncedSearch;

	// Default to all types when none selected
	const effectiveTypes =
		selectedTypes.length > 0
			? selectedTypes
			: ["http", "ping", "docker", "port", "game", "grpc", "websocket"];

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

	const {
		data: monitorsWithChecksData,
		isLoading: monitorsWithChecksLoading,
		error: monitorsWithChecksError,
		refetch,
	} = useGet<MonitorsWithChecksResponse>(
		monitorsWithChecksUrl,
		{},
		{ refreshInterval: 5000, keepPreviousData: true }
	);

	const {
		monitors: monitorsWithChecks,
		summary,
		count,
	} = monitorsWithChecksData ?? { monitors: null, summary: null, count: 0 };

	// Delete hook
	const { deleteFn, loading: isDeleting } = useDelete();

	// Handlers
	const handleClearFilters = useCallback(() => {
		setSelectedTypes([]);
		setSelectedStatus("");
		setSelectedState("");
		setSearch("");
	}, []);

	const handleConfirm = async () => {
		if (!selectedMonitor) return;
		await deleteFn(`/monitors/${selectedMonitor.id}`);
		setSelectedMonitor(null);
		refetch();
	};

	const handleCancel = () => {
		setSelectedMonitor(null);
	};

	const isLoading = monitorsWithChecksLoading;

	// Check if any filters are active
	const hasActiveFilters = Boolean(
		selectedTypes.length > 0 || selectedStatus || selectedState || search
	);

	// Show empty state only when there are truly no monitors (not just filtered out)
	// If filters are active and count is 0, pass 1 to prevent empty state fallback
	const effectiveTotalCount =
		hasActiveFilters && (summary?.totalMonitors ?? 0) === 0
			? 1
			: (summary?.totalMonitors ?? 0);

	return (
		<MonitorBasePageWithStates
			headerKey="uptime"
			loading={isLoading}
			error={monitorsWithChecksError}
			totalCount={effectiveTotalCount}
			page="uptime"
			actionLink="/uptime/create"
		>
			<HeaderCreate
				path="/uptime/create"
				isLoading={isLoading}
				isAdmin={isAdmin}
			/>

			<HeaderMonitorsSummary summary={summary} />

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
				setSelectedMonitor={setSelectedMonitor}
				count={count || 0}
				page={page}
				setPage={setPage}
				rowsPerPage={rowsPerPage}
				sortField={sortField}
				setSortField={setSortField}
				sortOrder={sortOrder}
				setSortOrder={setSortOrder}
				setRowsPerPage={(rowsPerPage: number) => {
					dispatch(
						setRowsPerPage({
							value: rowsPerPage,
							table: "monitors",
						})
					);
					setPage(0);
				}}
			/>
			<Dialog
				open={isDialogOpen}
				title={t("common.dialogs.delete.title")}
				content={t("common.dialogs.delete.description")}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
				loading={isDeleting}
			/>
		</MonitorBasePageWithStates>
	);
};

export default UptimeMonitorsPage;
