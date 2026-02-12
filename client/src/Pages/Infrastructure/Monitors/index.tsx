import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MonitorBasePageWithStates } from "@/Components/v2/design-elements";
import { HeaderCreate } from "@/Components/v2/common";
import { ControlsFilter, HeaderMonitorsSummary } from "@/Components/v2/monitors";
import { TextField, Dialog } from "@/Components/v2/inputs";

import { useGet, useDelete } from "@/Hooks/UseApi";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import type { Monitor, MonitorsWithChecksResponse } from "@/Types/Monitor";
import { useTheme } from "@mui/material";
import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { setRowsPerPage } from "@/Features/UI/uiSlice.js";
import type { RootState } from "@/Types/state";
import { InfraMonitorsTable } from "./Components/MonitorsTable";
import useDebounce from "@/Hooks/useDebounce";

const InfrastructureMonitors = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const isAdmin = useIsAdmin();
	const dispatch = useDispatch();

	// Redux state
	const rowsPerPage = useSelector(
		(state: RootState) => state.ui?.infrastructure?.rowsPerPage ?? 5
	);

	// Local state
	const [selectedStatus, setSelectedStatus] = useState<string>("");
	const [selectedState, setSelectedState] = useState<string>("");
	const [search, setSearch] = useState<string>("");
	const [page, setPage] = useState<number>(0);
	const [sortField, setSortField] = useState<string>("");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
	const isDialogOpen = Boolean(selectedMonitor);

	const debouncedSearch = useDebounce<string>(search, 300);

	const handleClearFilters = useCallback(() => {
		setSelectedStatus("");
		setSelectedState("");
		setSearch("");
	}, []);

	// Convert filter selections to API filter values
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
	// Priority: status > isActive > search
	const filterLookup = new Map<string | undefined, string>([
		[toFilterStatus, "status"],
		[toFilterActive, "isActive"],
	]);
	const activeFilter = [...filterLookup].find(([key]) => key !== undefined);
	const field = activeFilter?.[1] || (debouncedSearch ? "name" : sortField || undefined);
	const filter = activeFilter?.[0] || debouncedSearch || undefined;

	// Build URL for monitors with checks
	const monitorsWithChecksUrl = useMemo(() => {
		const params = new URLSearchParams();
		params.append("type", "hardware");
		params.append("limit", "1");
		if (page !== undefined) params.append("page", String(page));
		if (rowsPerPage) params.append("rowsPerPage", String(rowsPerPage));
		if (filter) params.append("filter", filter);
		if (field) params.append("field", field);
		if (sortOrder) params.append("order", sortOrder);
		return `/monitors/team/with-checks?${params.toString()}`;
	}, [page, rowsPerPage, filter, field, sortOrder]);

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

	const { summary, count } = monitorsWithChecksData ?? { summary: null, count: 0 };
	const isLoading = monitorsWithChecksLoading;

	// Check if any filters are active
	const hasActiveFilters = Boolean(selectedStatus || selectedState || search);

	// Show empty state only when there are truly no monitors (not just filtered out)
	const effectiveTotalCount =
		hasActiveFilters && (summary?.totalMonitors ?? 0) === 0
			? 1
			: (summary?.totalMonitors ?? 0);

	// Delete hook
	const { deleteFn, loading: isDeleting } = useDelete();

	const handleConfirm = async () => {
		if (!selectedMonitor) return;
		await deleteFn(`/monitors/${selectedMonitor.id}`);
		setSelectedMonitor(null);
		refetch();
	};

	const handleCancel = () => {
		setSelectedMonitor(null);
	};

	return (
		<MonitorBasePageWithStates
			loading={isLoading}
			error={monitorsWithChecksError}
			totalCount={effectiveTotalCount}
			page="infrastructure"
			actionLink="/infrastructure/create"
		>
			<HeaderCreate
				path="/infrastructure/create"
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
					showTypes={false}
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
			<InfraMonitorsTable
				monitors={monitorsWithChecksData?.monitors || []}
				refetch={refetch}
				setSelectedMonitor={setSelectedMonitor}
				sortField={sortField}
				setSortField={setSortField}
				sortOrder={sortOrder}
				setSortOrder={setSortOrder}
				count={count || 0}
				page={page}
				setPage={setPage}
				rowsPerPage={rowsPerPage}
				setRowsPerPage={(value: number) => {
					dispatch(
						setRowsPerPage({
							value,
							table: "infrastructure",
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

export default InfrastructureMonitors;
