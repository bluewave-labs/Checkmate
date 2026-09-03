import { setRowsPerPage, type TableName } from "@/Features/UI/uiSlice";
import { useDelete, useGet } from "@/Hooks/UseApi";
import { useBulkMonitorActions } from "@/Hooks/useBulkMonitorActions";
import useDebounce from "@/Hooks/useDebounce";
import type { RootState } from "@/store";
import {
	MonitorStatus,
	type MonitorsWithChecksResponse,
	SelectableMonitorTypes,
	type Monitor,
	type MonitorType,
} from "@/Types/Monitor";
import type { Tag } from "@/Types/Tag";
import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

interface MonitorListConfig {
	types: MonitorType[] | "selectable";
	checksLimit: number;
	refreshInterval: number;
	rowsPerPageTable: TableName;
	rowsPerPageDefault: number;
	initialSortField?: string; // default ""
}

export const useMonitorListController = (config: MonitorListConfig) => {
	const dispatch = useDispatch();
	const rowsPerPage = useSelector(
		(state: RootState) =>
			state.ui?.[config.rowsPerPageTable]?.rowsPerPage ?? config.rowsPerPageDefault
	);

	// Filter states
	const [selectedTypes, setSelectedTypes] = useState<MonitorType[]>([]);
	const [selectedStatus, setSelectedStatus] = useState<string>("");
	const [selectedState, setSelectedState] = useState<string>("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [page, setPage] = useState<number>(0);
	const [search, setSearch] = useState<string>("");
	const [sortField, setSortField] = useState<string>(config.initialSortField ?? "");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
	const debouncedSearch = useDebounce<string>(search, 300);

	// Convert filter selections to API filter values
	// Status: pass "up"/"down" directly to the API
	// State: "active" -> true, "paused" -> false
	const toFilterStatus = useMemo(() => {
		if (selectedStatus === MonitorStatus.Up) return MonitorStatus.Up;
		if (selectedStatus === MonitorStatus.Down) return MonitorStatus.Down;
		return undefined;
	}, [selectedStatus]);

	const toFilterActive = useMemo(() => {
		if (selectedState === "active") return "true";
		if (selectedState === MonitorStatus.Paused) return "false";
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
	const filter = activeFilter?.[0] || debouncedSearch || undefined;

	const effectiveTypes = useMemo(() => {
		return config.types === "selectable"
			? selectedTypes.length > 0
				? selectedTypes
				: [...SelectableMonitorTypes]
			: config.types;
	}, [config.types, selectedTypes]);

	// Fetching
	const monitorsWithChecksUrl = useMemo(() => {
		const params = new URLSearchParams();
		effectiveTypes.forEach((type) => params.append("type", type));
		selectedTags.forEach((tag) => params.append("tags", tag));
		params.append("limit", String(config.checksLimit));
		if (page !== undefined) params.append("page", String(page));
		if (rowsPerPage) params.append("rowsPerPage", String(rowsPerPage));
		if (filter) params.append("filter", filter);
		if (field) params.append("field", field);
		if (sortOrder) params.append("order", sortOrder);
		return `/monitors/team/with-checks?${params.toString()}`;
	}, [
		effectiveTypes,
		selectedTags,
		page,
		rowsPerPage,
		filter,
		field,
		sortOrder,
		config.checksLimit,
	]);

	const {
		data: monitorsWithChecksData,
		isLoading,
		error,
		refetch,
	} = useGet<MonitorsWithChecksResponse>(
		monitorsWithChecksUrl,
		{},
		{ refreshInterval: config.refreshInterval, keepPreviousData: true }
	);
	const { data: tags } = useGet<Tag[]>("/tags/team");

	const bulk = useBulkMonitorActions(refetch, page);

	// Delete ops
	const { deleteFn, loading: isDeleting } = useDelete();
	const handleConfirmDelete = async () => {
		if (!selectedMonitor) return;
		await deleteFn(`/monitors/${selectedMonitor.id}`);
		setSelectedMonitor(null);
		refetch();
	};
	const handleCancelDelete = () => setSelectedMonitor(null);

	// Handle filters
	const handleClearFilters = useCallback(() => {
		setSelectedTypes([]);
		setSelectedStatus("");
		setSelectedState("");
		setSelectedTags([]);
		setSearch("");
	}, []);

	const handleSetRowsPerPage = (value: number) => {
		dispatch(setRowsPerPage({ value, table: config.rowsPerPageTable }));
		setPage(0);
	};

	// Check for active filters
	const hasActiveFilters = Boolean(
		selectedTypes.length > 0 ||
		selectedStatus ||
		selectedState ||
		selectedTags.length > 0 ||
		search
	);

	// Show empty state only when there are truly no monitors (not just filtered out)
	// If filters are active and count is 0, pass 1 to prevent empty state fallback

	const { monitors, summary, count } = monitorsWithChecksData ?? {
		monitors: null,
		summary: null,
		count: 0,
	};

	const effectiveTotalCount =
		hasActiveFilters && (summary?.totalMonitors ?? 0) === 0
			? 1
			: (summary?.totalMonitors ?? 0);

	return {
		// Data
		monitors,
		summary,
		count,
		tags,
		isLoading,
		error,
		refetch,
		effectiveTotalCount,
		hasActiveFilters,

		// Filter state and setters
		selectedTypes,
		setSelectedTypes,
		selectedStatus,
		setSelectedStatus,
		selectedState,
		setSelectedState,
		selectedTags,
		setSelectedTags,
		search,
		setSearch,
		handleClearFilters,

		// Paging and Sorting
		page,
		setPage,
		rowsPerPage,
		handleSetRowsPerPage,
		sortField,
		setSortField,
		sortOrder,
		setSortOrder,

		// Delete
		selectedMonitor,
		setSelectedMonitor,
		isDialogOpen: Boolean(selectedMonitor),
		isDeleting,
		handleConfirmDelete,
		handleCancelDelete,

		// Rendered only when config.bulkActions
		...bulk,
	};
};

export type MonitorListController = ReturnType<typeof useMonitorListController>;
