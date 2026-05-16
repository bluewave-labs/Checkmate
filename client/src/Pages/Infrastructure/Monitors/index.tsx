import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MonitorBasePageWithStates } from "@/Components/design-elements";
import { HeaderCreate } from "@/Components/common";
import {
	ControlsFilter,
	HeaderMonitorsSummary,
	BulkActionsBar,
} from "@/Components/monitors";
import { TextField, Dialog, Button, Autocomplete } from "@/Components/inputs";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { InfraMonitorsTable } from "@/Pages/Infrastructure/Monitors/Components/MonitorsTable";
import { Play, Pause, Bell } from "lucide-react";

import { useTranslation } from "react-i18next";
import { useGet, useDelete } from "@/Hooks/UseApi";
import type { Monitor, MonitorsWithChecksResponse } from "@/Types/Monitor";
import { useState, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setRowsPerPage } from "@/Features/UI/uiSlice.js";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import type { RootState } from "@/Types/state";
import { useTheme } from "@mui/material";
import useDebounce from "@/Hooks/useDebounce";
import { useBulkMonitorActions } from "@/Hooks/useBulkMonitorActions";
import type { Notification } from "@/Types/Notification";

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
	const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
	const [selectedNotificationIds, setSelectedNotificationIds] = useState<string[]>([]);
	const [notificationAction, setNotificationAction] = useState<"add" | "remove">("add");

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

	const { data: notifications } = useGet<Notification[]>("/notifications/team");

	// Bulk actions
	const {
		selectedRows,
		setSelectedRows,
		handleBulkPause,
		handleBulkResume,
		handleBulkAddNotifications,
		handleBulkRemoveNotifications,
		handleCancelSelection,
	} = useBulkMonitorActions(refetch, page);

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

	const openAddNotifications = () => {
		setNotificationAction("add");
		setSelectedNotificationIds([]);
		setNotificationDialogOpen(true);
	};

	const openRemoveNotifications = () => {
		setNotificationAction("remove");
		setSelectedNotificationIds([]);
		setNotificationDialogOpen(true);
	};

	const handleNotificationConfirm = async () => {
		if (notificationAction === "add") {
			await handleBulkAddNotifications(selectedNotificationIds);
		} else {
			await handleBulkRemoveNotifications(selectedNotificationIds);
		}
		setNotificationDialogOpen(false);
		setSelectedNotificationIds([]);
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
					<Button
						size="small"
						startIcon={<Bell size={16} />}
						onClick={openAddNotifications}
					>
						{t("pages.uptime.monitors.bulkActions.addNotifications")}
					</Button>
					<Button
						size="small"
						color="error"
						startIcon={<Bell size={16} />}
						onClick={openRemoveNotifications}
					>
						{t("pages.uptime.monitors.bulkActions.removeNotifications")}
					</Button>
				</BulkActionsBar>
			)}

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
			<Dialog
				open={notificationDialogOpen}
				title={
					notificationAction === "add"
						? t("pages.uptime.monitors.bulkActions.addNotifications")
						: t("pages.uptime.monitors.bulkActions.removeNotifications")
				}
				onConfirm={handleNotificationConfirm}
				onCancel={() => setNotificationDialogOpen(false)}
				confirmText={t("common.buttons.confirm")}
			>
				<Box>
					<Typography mb={2}>
						{notificationAction === "add"
							? t("pages.uptime.monitors.bulkActions.selectToAdd")
							: t("pages.uptime.monitors.bulkActions.selectToRemove")}
					</Typography>
					<Autocomplete
						multiple
						options={notifications ?? []}
						getOptionLabel={(option) => option.notificationName}
						value={(notifications ?? []).filter((n) =>
							selectedNotificationIds.includes(n.id)
						)}
						onChange={(_, newValue) =>
							setSelectedNotificationIds(newValue.map((n: Notification) => n.id))
						}
						renderInput={(params) => (
							<TextField
								{...params}
								placeholder={t("pages.uptime.monitors.bulkActions.selectPlaceholder")}
							/>
						)}
					/>
				</Box>
			</Dialog>
		</MonitorBasePageWithStates>
	);
};

export default InfrastructureMonitors;
