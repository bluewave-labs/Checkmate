import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MonitorBasePageWithStates, ColoredLabel } from "@/Components/design-elements";
import { HeaderCreate } from "@/Components/common";
import {
	ControlsFilter,
	HeaderMonitorsSummary,
	BulkActionsBar,
} from "@/Components/monitors";
import { TextField, Dialog, Button } from "@/Components/inputs";
import { Play, Pause } from "lucide-react";

import { useGet, useDelete } from "@/Hooks/UseApi";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import type { Monitor, MonitorsWithChecksResponse } from "@/Types/Monitor";
import type { Tag } from "@/Types/Tag";
import { useTheme } from "@mui/material";
import { SPACING } from "@/Utils/Theme/constants";
import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { setRowsPerPage } from "@/Features/UI/uiSlice.js";
import type { RootState } from "@/Types/state";
import { InfraMonitorsTable } from "./Components/MonitorsTable";
import useDebounce from "@/Hooks/useDebounce";
import { useBulkMonitorActions } from "@/Hooks/useBulkMonitorActions";

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
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [search, setSearch] = useState<string>("");
	const [page, setPage] = useState<number>(0);
	const [sortField, setSortField] = useState<string>("");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);

	const { data: tags } = useGet<Tag[]>("/tags/team");

	const isDialogOpen = Boolean(selectedMonitor);

	const debouncedSearch = useDebounce<string>(search, 300);

	const handleClearFilters = useCallback(() => {
		setSelectedStatus("");
		setSelectedState("");
		setSelectedTags([]);
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
		selectedTags.forEach((tagId) => params.append("tags", tagId));
		params.append("limit", "1");
		if (page !== undefined) params.append("page", String(page));
		if (rowsPerPage) params.append("rowsPerPage", String(rowsPerPage));
		if (filter) params.append("filter", filter);
		if (field) params.append("field", field);
		if (sortOrder) params.append("order", sortOrder);
		return `/monitors/team/with-checks?${params.toString()}`;
	}, [page, rowsPerPage, filter, field, sortOrder, selectedTags]);

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

	// Bulk actions
	const {
		selectedRows,
		setSelectedRows,
		handleBulkPause,
		handleBulkResume,
		handleCancelSelection,
	} = useBulkMonitorActions(refetch, page);

	// Check if any filters are active
	const hasActiveFilters = Boolean(
		selectedStatus || selectedState || selectedTags.length > 0 || search
	);

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
			headerKey="infrastructure"
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
			<HeaderMonitorsSummary
				summary={summary}
				showBreached={true}
			/>
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
					tagOptions={tags ?? []}
					selectedTags={selectedTags}
					setSelectedTags={setSelectedTags}
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

			{selectedTags.length > 0 && (
				<Stack
					direction={isSmall ? "column" : "row"}
					alignItems={isSmall ? "flex-start" : "center"}
					flexWrap="wrap"
					gap={theme.spacing(SPACING.XL)}
				>
					<Typography color={theme.palette.text.secondary}>
						{t("pages.uptime.filters.activeTags")}
					</Typography>
					{selectedTags.map((tagId) => {
						const tag = tags?.find((t) => t.id === tagId);
						if (!tag) return null;
						return (
							<ColoredLabel
								key={tag.id}
								text={tag.name}
								color={tag.color}
							/>
						);
					})}
				</Stack>
			)}

			{!isLoading && (
				<BulkActionsBar
					selectedCount={selectedRows.length}
					onCancel={handleCancelSelection}
				>
					<Button
						size="small"
						startIcon={<Play size={16} />}
						onClick={handleBulkResume}
					>
						{t("common.buttons.resume")}
					</Button>
					<Button
						size="small"
						startIcon={<Pause size={16} />}
						onClick={handleBulkPause}
					>
						{t("common.buttons.pause")}
					</Button>
				</BulkActionsBar>
			)}

			<InfraMonitorsTable
				monitors={monitorsWithChecksData?.monitors || []}
				tags={tags ?? []}
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
				selectedRows={selectedRows}
				onSelectionChange={setSelectedRows}
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
