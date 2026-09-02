import { BasePage } from "@/Components/design-elements";
import { HeaderTimeRange } from "@/Components/common";
import type { PageSpeedDetailsResponse } from "@/Types/Monitor";
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
import { useParams } from "react-router-dom";
import { useTheme } from "@mui/material";
import { useState, useMemo } from "react";
import type { DateRange } from "@/Types/Query";

const PageSpeedDetails = () => {
	const { monitorId } = useParams();
	const isAdmin = useIsAdmin();
	const theme = useTheme();
	const [dateRange, setDateRange] = useState<DateRange>("day");

	const monitorDetailsUrl = useMemo(() => {
		if (!monitorId) {
			return null;
		}
		const params = new URLSearchParams();
		params.append("dateRange", dateRange);
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

	const monitor = monitorData?.monitorData?.monitor;
	const groupedChecks = monitorData?.monitorData?.groupedChecks || [];
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
				setDateRange={setDateRange}
			/>
			<HistogramPageSpeedDetails
				checks={groupedChecks}
				range={dateRange}
			/>
			<Stack
				direction={{ xs: "column", md: "row" }}
				gap={theme.spacing(10)}
			>
				<PiePageSpeed latestCheck={latestCheck} />
				<PiePageSpeedLegend latestCheck={latestCheck} />
			</Stack>
		</BasePage>
	);
};
export default PageSpeedDetails;
