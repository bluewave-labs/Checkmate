import { BasePage } from "@/Components/v2/design-elements";
import type { PageSpeedDetailsResponse } from "@/Types/Monitor";
import Stack from "@mui/material/Stack";
import {
	HistogramPageSpeedDetails,
	PiePageSpeed,
	PiePageSpeedLegend,
	MonitorStatBoxes,
	HeaderMonitorControls,
} from "@/Components/v2/monitors";

import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useGet } from "@/Hooks/UseApi";
import { useParams } from "react-router-dom";
import { useTheme } from "@mui/material";

const PageSpeedDetails = () => {
	const { monitorId } = useParams();
	const isAdmin = useIsAdmin();
	const theme = useTheme();
	const {
		data: monitorData,
		isLoading,
		error,
		refetch,
	} = useGet<PageSpeedDetailsResponse>(
		monitorId ? `/monitors/pagespeed/details/${monitorId}?dateRange=day` : null,
		{},
		{ keepPreviousData: true, refreshInterval: 30000 }
	);

	const monitor = monitorData?.monitor;
	const monitorStats = monitorData?.monitorStats || null;

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
			<HistogramPageSpeedDetails
				checks={monitor?.recentChecks || []}
				range="day"
			/>
			<Stack
				direction={{ xs: "column", md: "row" }}
				gap={theme.spacing(10)}
			>
				<PiePageSpeed latestCheck={monitor?.recentChecks?.[0]} />
				<PiePageSpeedLegend latestCheck={monitor?.recentChecks?.[0]} />
			</Stack>
		</BasePage>
	);
};
export default PageSpeedDetails;
