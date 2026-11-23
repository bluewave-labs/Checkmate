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
import { logger } from "@/Utils/logger";

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

	// Helper to preload pagination chunks (before or after)
	const fetchChunk = useCallback(
		async (direction: "before" | "after") => {
			const cursorDate =
				direction === "before" ? pagination?.oldestDate : pagination?.newestDate;
			const hasMore =
				direction === "before" ? pagination?.hasMoreBefore : pagination?.hasMoreAfter;

			if (!monitorId || !hasMore || !cursorDate || isFetchingRef.current) return;

			isFetchingRef.current = true;
			if (direction === "before") setIsLoadingBefore(true);
			else setIsLoadingAfter(true);

			try {
				const params = new URLSearchParams({
					dateRange,
					[direction]: cursorDate,
					limit: "20",
				});
				const res = await get<ApiResponse<PageSpeedDetailsResponse>>(
					`/monitors/pagespeed/details/${monitorId}?${params.toString()}`
				);

				const mData = res.data?.data?.monitorData;
				if (res.data?.success && mData) {
					const newChecks = mData.groupedChecks || [];
					if (newChecks.length > 0) {
						setChecks((prev) => {
							const existingDates = new Set(prev.map((c) => c.bucketDate));
							const filteredNew = newChecks.filter(
								(c) => !existingDates.has(c.bucketDate)
							);
							return direction === "before"
								? [...filteredNew, ...prev]
								: [...prev, ...filteredNew];
						});
					}
					if (mData.pagination) {
						setPagination((prev) => ({
							hasMoreBefore:
								direction === "before"
									? !!mData.pagination?.hasMoreBefore
									: (prev?.hasMoreBefore ?? false),
							oldestDate:
								direction === "before"
									? (mData.pagination?.oldestDate ?? prev?.oldestDate ?? null)
									: (prev?.oldestDate ?? null),
							hasMoreAfter:
								direction === "after"
									? !!mData.pagination?.hasMoreAfter
									: (prev?.hasMoreAfter ?? false),
							newestDate:
								direction === "after"
									? (mData.pagination?.newestDate ?? prev?.newestDate ?? null)
									: (prev?.newestDate ?? null),
						}));
					}
				}
			} catch (err) {
				logger.error(
					`Failed to preload ${direction} pagespeed checks`,
					err instanceof Error ? err : undefined,
					{ monitorId, cursorDate }
				);
			} finally {
				if (direction === "before") setIsLoadingBefore(false);
				else setIsLoadingAfter(false);
				isFetchingRef.current = false;
			}
		},
		[monitorId, dateRange, pagination]
	);

	const handleLoadBefore = useCallback(() => fetchChunk("before"), [fetchChunk]);
	const handleLoadAfter = useCallback(() => fetchChunk("after"), [fetchChunk]);

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
