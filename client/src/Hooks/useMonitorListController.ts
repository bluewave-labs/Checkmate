import { setRowsPerPage, setTableSort, type TableName } from "@/Features/UI/uiSlice";
import { useDelete, useGet } from "@/Hooks/UseApi";
import { useBulkMonitorActions } from "@/Hooks/useBulkMonitorActions";
import type { RootState } from "@/store";
import {
	type MonitorsWithChecksResponse,
	MonitorStateFilters,
	MonitorStatusFilters,
	SelectableMonitorTypes,
	type MonitorStateFilter,
	type MonitorStatusFilter,
	type Monitor,
	type MonitorType,
} from "@/Types/Monitor";
import type { Tag } from "@/Types/Tag";
import type { SortOrder } from "@/Types/Query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

interface MonitorListConfig {
	types: MonitorType[] | "selectable";
	checksLimit: number;
	refreshInterval: number;
	rowsPerPageTable: TableName;
	rowsPerPageDefault: number;
	initialSortField?: string; // default ""
}

type ParamChanges = Record<string, string | string[] | undefined>;

const SEARCH_DEBOUNCE_MS = 300;

const pickAllowed = <T extends string>(allowed: readonly T[], value: string | null) =>
	allowed.find((option) => option === value);

export const useMonitorListController = (config: MonitorListConfig) => {
	const dispatch = useDispatch();
	const tableState = useSelector(
		(state: RootState) => state.ui?.[config.rowsPerPageTable]
	);
	const rowsPerPage = tableState?.rowsPerPage ?? config.rowsPerPageDefault;
	const sortField = tableState?.sortField ?? config.initialSortField ?? "";
	const sortOrder = tableState?.sortOrder ?? "asc";

	const [searchParams, setSearchParams] = useSearchParams();
	const { data: tags, error: tagsError } = useGet<Tag[]>("/tags/team");
	const selectedTypes = useMemo<MonitorType[]>(
		() =>
			config.types === "selectable"
				? searchParams
						.getAll("type")
						.flatMap((type) => pickAllowed(SelectableMonitorTypes, type) ?? [])
				: [],
		[config.types, searchParams]
	);
	const selectedStatus: MonitorStatusFilter | "" =
		pickAllowed(MonitorStatusFilters, searchParams.get("status")) ?? "";
	const selectedState: MonitorStateFilter | "" =
		pickAllowed(MonitorStateFilters, searchParams.get("state")) ?? "";
	const urlTags = useMemo(() => searchParams.getAll("tags"), [searchParams]);
	const selectedTags = useMemo(
		() => urlTags.filter((id) => tags?.some((tag) => tag.id === id)),
		[urlTags, tags]
	);
	const isTagsPending = urlTags.length > 0 && !tags && !tagsError;
	const urlPage = Number(searchParams.get("page"));
	const page = Number.isInteger(urlPage) && urlPage > 1 ? urlPage - 1 : 0;
	const urlSearch = searchParams.get("search") ?? "";
	const [search, setSearchInput] = useState<string>(urlSearch);
	const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);

	const updateParams = useCallback(
		(changes: ParamChanges) => {
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);
					Object.entries(changes).forEach(([key, value]) => {
						next.delete(key);
						[value ?? []]
							.flat()
							.filter(Boolean)
							.forEach((item) => next.append(key, item));
					});
					return next;
				},
				{ replace: true }
			);
		},
		[setSearchParams]
	);

	const updateFilters = useCallback(
		(changes: ParamChanges) => updateParams({ ...changes, page: undefined }),
		[updateParams]
	);

	const setSelectedTypes = useCallback(
		(types: MonitorType[]) => updateFilters({ type: types }),
		[updateFilters]
	);

	const setSelectedStatus = useCallback(
		(status: MonitorStatusFilter) => updateFilters({ status }),
		[updateFilters]
	);

	const setSelectedState = useCallback(
		(state: MonitorStateFilter) => updateFilters({ state }),
		[updateFilters]
	);

	const setSelectedTags = useCallback(
		(tags: string[]) => updateFilters({ tags }),
		[updateFilters]
	);

	const setPage = useCallback(
		(next: number) => updateParams({ page: next > 0 ? String(next + 1) : undefined }),
		[updateParams]
	);

	const searchTimer = useRef<ReturnType<typeof setTimeout>>();
	const latestUpdateFilters = useRef(updateFilters);

	useEffect(() => {
		latestUpdateFilters.current = updateFilters;
	}, [updateFilters]);

	useEffect(() => {
		setSearchInput(urlSearch);
		return () => clearTimeout(searchTimer.current);
	}, [urlSearch]);

	const setSearch = useCallback((value: string) => {
		setSearchInput(value);
		clearTimeout(searchTimer.current);
		searchTimer.current = setTimeout(
			() => latestUpdateFilters.current({ search: value }),
			SEARCH_DEBOUNCE_MS
		);
	}, []);

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
	const field = activeFilter?.[1] || (urlSearch ? "name" : sortField || undefined);
	const filter = activeFilter?.[0] || urlSearch || undefined;

	const effectiveTypes = useMemo(() => {
		return config.types === "selectable"
			? selectedTypes.length > 0
				? selectedTypes
				: [...SelectableMonitorTypes]
			: config.types;
	}, [config.types, selectedTypes]);

	// Fetching
	const monitorsWithChecksUrl = useMemo(() => {
		if (isTagsPending) return null;
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
		isTagsPending,
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
		clearTimeout(searchTimer.current);
		setSearchInput("");
		updateFilters({
			type: undefined,
			status: undefined,
			state: undefined,
			tags: undefined,
			search: undefined,
		});
	}, [updateFilters]);

	const handleSetRowsPerPage = (value: number) => {
		dispatch(setRowsPerPage({ value, table: config.rowsPerPageTable }));
		setPage(0);
	};

	const setSort = (field: string, order: SortOrder) => {
		dispatch(setTableSort({ field, order, table: config.rowsPerPageTable }));
		setPage(0);
	};

	// Check for active filters
	const hasActiveFilters = Boolean(
		selectedTypes.length > 0 ||
		selectedStatus ||
		selectedState ||
		selectedTags.length > 0 ||
		urlSearch
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
		isLoading: isLoading || isTagsPending,
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
		sortOrder,
		setSort,

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
