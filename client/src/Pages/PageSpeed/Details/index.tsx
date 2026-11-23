import { BasePage } from "@/Components/design-elements";
import { HeaderTimeRange } from "@/Components/common";
import type { PageSpeedDetailsResponse, PageSpeedPagination } from "@/Types/Monitor";
import type { PageSpeedGroupedCheck } from "@/Types/Check";
import Stack from "@mui/material/Stack";
import {
	HistogramPageSpeedDetails,
	PiePageSpeed,
	PiePageSpeedLegend,
	MonitorStatBoxes,
	HeaderMonitorControls,
} from "@/Components/monitors";

import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useGet } from "@/Hooks/UseApi";
import { get } from "@/Utils/ApiClient";
import type { ApiResponse } from "@/Hooks/UseApi";
import { useParams } from "react-router-dom";
import { useTheme } from "@mui/material";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { DateRange } from "@/Types/Query";
import { LAYOUT } from "@/Utils/Theme/constants";

const PageSpeedDetails = () => {
	const { monitorId } = useParams();
	const isAdmin = useIsAdmin();
	const theme = useTheme();
	const [dateRange, setDateRange] = useState<DateRange>("day");

	const [checks, setChecks] = useState<PageSpeedGroupedCheck[]>([]);
	const [pagination, setPagination] = useState<PageSpeedPagination | null>(null);
	const [isLoadingBefore, setIsLoadingBefore] = useState(false);
	const [isLoadingAfter, setIsLoadingAfter] = useState(false);
	const isFetchingRef = useRef(false);

	const monitorDetailsUrl = useMemo(() => {
		if (!monitorId) {
			return null;
		}
		const params = new URLSearchParams();
		params.append("dateRange", dateRange);
		params.append("limit", "30");
		return `/monitors/pagespeed/details/${monitorId}?${params.toString()}`;
	}, [monitorId, dateRange]);

	const {
		data: monitorData,
		isLoading,
		error,
		refetch,
	} = useGet<PageSpeedDetailsResponse>(
		monitorDetailsUrl,
		{},
		{ keepPreviousData: true, refreshInterval: 30000 }
	);

	// Sync initial or refreshed data
	const hasLoadedInitialRef = useRef(false);
	useEffect(() => {
		if (monitorData?.monitorData?.groupedChecks && !hasLoadedInitialRef.current) {
			hasLoadedInitialRef.current = true;
			setChecks(monitorData.monitorData.groupedChecks);
			setPagination(monitorData.monitorData.pagination ?? null);
		}
	}, [monitorData]);

	// Reset checks when dateRange changes
	const handleDateRangeChange = (newRange: DateRange) => {
		hasLoadedInitialRef.current = false;
		setDateRange(newRange);
	};

	// Preload older chunk (before)
	const handleLoadBefore = useCallback(async () => {
		if (
			!monitorId ||
			!pagination?.hasMoreBefore ||
			!pagination?.oldestDate ||
			isFetchingRef.current
		) {
			return;
		}

		isFetchingRef.current = true;
		setIsLoadingBefore(true);

		try {
			const params = new URLSearchParams();
			params.append("dateRange", dateRange);
			params.append("before", pagination.oldestDate);
			params.append("limit", "20");

			const res = await get<ApiResponse<PageSpeedDetailsResponse>>(
				`/monitors/pagespeed/details/${monitorId}?${params.toString()}`
			);

			if (res.data?.success && res.data.data?.monitorData) {
				const newChecks = res.data.data.monitorData.groupedChecks || [];
				const newPagination = res.data.data.monitorData.pagination;

				if (newChecks.length > 0) {
					setChecks((prev) => {
						const existingDates = new Set(prev.map((c) => c.bucketDate));
						const filteredNew = newChecks.filter((c) => !existingDates.has(c.bucketDate));
						return [...filteredNew, ...prev];
					});
				}

				if (newPagination) {
					setPagination((prev) => ({
						...prev,
						hasMoreBefore: newPagination.hasMoreBefore,
						oldestDate: newPagination.oldestDate ?? prev?.oldestDate ?? null,
						hasMoreAfter: prev?.hasMoreAfter ?? false,
						newestDate: prev?.newestDate ?? null,
					}));
				}
			}
		} catch {
			// Fail gracefully
		} finally {
			setIsLoadingBefore(false);
			isFetchingRef.current = false;
		}
	}, [monitorId, dateRange, pagination]);

	// Preload newer chunk (after)
	const handleLoadAfter = useCallback(async () => {
		if (
			!monitorId ||
			!pagination?.hasMoreAfter ||
			!pagination?.newestDate ||
			isFetchingRef.current
		) {
			return;
		}

		isFetchingRef.current = true;
		setIsLoadingAfter(true);

		try {
			const params = new URLSearchParams();
			params.append("dateRange", dateRange);
			params.append("after", pagination.newestDate);
			params.append("limit", "20");

			const res = await get<ApiResponse<PageSpeedDetailsResponse>>(
				`/monitors/pagespeed/details/${monitorId}?${params.toString()}`
			);

			if (res.data?.success && res.data.data?.monitorData) {
				const newChecks = res.data.data.monitorData.groupedChecks || [];
				const newPagination = res.data.data.monitorData.pagination;

				if (newChecks.length > 0) {
					setChecks((prev) => {
						const existingDates = new Set(prev.map((c) => c.bucketDate));
						const filteredNew = newChecks.filter((c) => !existingDates.has(c.bucketDate));
						return [...prev, ...filteredNew];
					});
				}

				if (newPagination) {
					setPagination((prev) => ({
						...prev,
						hasMoreAfter: newPagination.hasMoreAfter,
						newestDate: newPagination.newestDate ?? prev?.newestDate ?? null,
						hasMoreBefore: prev?.hasMoreBefore ?? false,
						oldestDate: prev?.oldestDate ?? null,
					}));
				}
			}
		} catch {
			// Fail gracefully
		} finally {
			setIsLoadingAfter(false);
			isFetchingRef.current = false;
		}
	}, [monitorId, dateRange, pagination]);

	const monitor = monitorData?.monitorData?.monitor;
	const monitorStats = monitorData?.monitorStats || null;
	const recentChecks = monitor?.recentChecks ?? [];
	const latestCheck = recentChecks[recentChecks.length - 1];

	return (
		<BasePage
			loading={isLoading}
			error={error}
		>
			<HeaderMonitorControls
				path="pagespeed"
				monitor={monitor}
				isAdmin={isAdmin}
				refetch={refetch}
			/>
			<MonitorStatBoxes
				monitor={monitor}
				monitorStats={monitorStats}
			/>
			<HeaderTimeRange
				isLoading={isLoading}
				hasDateRange={true}
				dateRange={dateRange}
				setDateRange={handleDateRangeChange}
			/>
			<HistogramPageSpeedDetails
				checks={checks}
				range={dateRange}
				hasMoreBefore={pagination?.hasMoreBefore}
				hasMoreAfter={pagination?.hasMoreAfter}
				isLoadingBefore={isLoadingBefore}
				isLoadingAfter={isLoadingAfter}
				onLoadBefore={handleLoadBefore}
				onLoadAfter={handleLoadAfter}
			/>
			<Stack
				direction={{ xs: "column", md: "row" }}
				gap={theme.spacing(LAYOUT.MD)}
			>
				<PiePageSpeed latestCheck={latestCheck} />
				<PiePageSpeedLegend latestCheck={latestCheck} />
			</Stack>
		</BasePage>
	);
};
export default PageSpeedDetails;
