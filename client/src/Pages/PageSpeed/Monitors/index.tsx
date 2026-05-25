import {
	MonitorBasePageWithStates,
	PageSpeedKeyPriorityFallback,
	ColoredLabel,
} from "@/Components/design-elements";
import { Dialog, TextField } from "@/Components/inputs";
import { HeaderCreate } from "@/Components/common";
import { PageSpeedMonitorsTable } from "@/Pages/PageSpeed/Monitors/Components/PageSpeedMonitorsTable";
import type { Monitor } from "@/Types/Monitor";
import type { Tag } from "@/Types/Tag";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material";
import { SPACING } from "@/Utils/Theme/constants";

import { useTranslation } from "react-i18next";
import { useCallback, useMemo, useState } from "react";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useGet, useDelete } from "@/Hooks/UseApi";
import useDebounce from "@/Hooks/useDebounce";
import type { MonitorsWithChecksResponse } from "@/Types/Monitor";
import type { AppSettingsResponse } from "@/Types/Settings";
import { ControlsFilter, HeaderMonitorsSummary } from "@/Components/monitors";

const PageSpeedMonitorsPage = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const isAdmin = useIsAdmin();
	const { deleteFn, loading: isDeleting } = useDelete();

	const settingsUrl = "/settings";
	const {
		data: settingsData,
		isLoading: settingsIsLoading,
		error: settingsError,
	} = useGet<AppSettingsResponse>(settingsUrl);

	const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
	const isDialogOpen = Boolean(selectedMonitor);
	const [sortField, setSortField] = useState<string>("name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [selectedStatus, setSelectedStatus] = useState<string>("");
	const [selectedState, setSelectedState] = useState<string>("");
	const [search, setSearch] = useState<string>("");

	const debouncedSearch = useDebounce<string>(search, 300);

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

	// Priority: status > isActive > search > sort
	const filterLookup = new Map<string | undefined, string>([
		[toFilterStatus, "status"],
		[toFilterActive, "isActive"],
	]);
	const activeFilter = [...filterLookup].find(([key]) => key !== undefined);
	const field = activeFilter?.[1] || (debouncedSearch ? "name" : sortField || undefined);
	const filter = activeFilter?.[0] || debouncedSearch;

	const { data: tags } = useGet<Tag[]>("/tags/team");

	const monitorsWithChecksUrl = useMemo(() => {
		const params = new URLSearchParams();
		params.append("type", "pagespeed");
		selectedTags.forEach((tagId) => params.append("tags", tagId));
		params.append("limit", "25");
		if (page !== undefined) params.append("page", String(page));
		if (rowsPerPage) params.append("rowsPerPage", String(rowsPerPage));
		if (filter) params.append("filter", filter);
		if (field) params.append("field", field);
		if (sortOrder) params.append("order", sortOrder);
		return `/monitors/team/with-checks?${params.toString()}`;
	}, [page, rowsPerPage, sortOrder, selectedTags, filter, field]);

	const {
		data: monitorsData,
		isLoading: monitorsIsLoading,
		error: monitorsError,
		refetch,
	} = useGet<MonitorsWithChecksResponse>(
		monitorsWithChecksUrl,
		{},
		{ refreshInterval: 30000 }
	);

	const monitors = monitorsData?.monitors;
	const monitorsCount = monitorsData?.count ?? 0;
	const summary = monitorsData?.summary ?? null;

	const isLoading = monitorsIsLoading || settingsIsLoading;

	const showApiKeyWarning = isAdmin && settingsData && !settingsData.pagespeedKeySet;

	const handleConfirm = async () => {
		if (!selectedMonitor) return;
		await deleteFn(`/monitors/${selectedMonitor.id}`);
		setSelectedMonitor(null);
		refetch();
	};

	const handleCancel = () => {
		setSelectedMonitor(null);
	};

	const handleClearFilters = useCallback(() => {
		setSelectedStatus("");
		setSelectedState("");
		setSelectedTags([]);
		setSearch("");
	}, []);

	const hasActiveFilters = Boolean(
		selectedStatus || selectedState || selectedTags.length > 0 || search
	);

	const effectiveTotalCount =
		hasActiveFilters && (summary?.totalMonitors ?? 0) === 0
			? 1
			: (summary?.totalMonitors ?? 0);

	return (
		<MonitorBasePageWithStates
			headerKey="pageSpeed"
			loading={isLoading}
			error={monitorsError || settingsError}
			totalCount={effectiveTotalCount}
			page="pageSpeed"
			actionLink="/pagespeed/create"
			priorityFallback={showApiKeyWarning ? <PageSpeedKeyPriorityFallback /> : undefined}
		>
			<HeaderCreate
				path="/pagespeed/create"
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

			<PageSpeedMonitorsTable
				monitors={monitors || []}
				tags={tags ?? []}
				refetch={refetch}
				setSelectedMonitor={setSelectedMonitor}
				sortField={sortField}
				setSortField={setSortField}
				sortOrder={sortOrder}
				setSortOrder={setSortOrder}
				count={monitorsCount || 0}
				page={page}
				setPage={setPage}
				rowsPerPage={rowsPerPage}
				setRowsPerPage={setRowsPerPage}
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

export default PageSpeedMonitorsPage;
