import Stack from "@mui/material/Stack";
import { SummaryBoxes } from "@/Pages/Infrastructure/Metrics/Components/SummaryBoxes";
import { CaptureErrors } from "@/Pages/Infrastructure/Metrics/Components/CaptureErrors";
import { OverviewCharts } from "@/Pages/Infrastructure/Metrics/Components/OverviewCharts";
import { OverviewGauges } from "@/Pages/Infrastructure/Metrics/Components/OverviewGauges";

import { useTheme } from "@mui/material";
import type { HardwareMetricsResponse } from "@/Types/Monitor";
import { LAYOUT } from "@/Utils/Theme/constants";
import type { DateRange } from "@/Types/Query";

export const TabOverview = ({
	metrics,
	dateRange,
}: {
	metrics: HardwareMetricsResponse | null;
	dateRange: DateRange;
}) => {
	const theme = useTheme();
	if (!metrics?.latest) {
		return null;
	}

	return (
		<Stack gap={theme.spacing(LAYOUT.LG)}>
			<SummaryBoxes latest={metrics.latest} />
			<OverviewGauges latest={metrics.latest} />
			<OverviewCharts
				buckets={metrics.buckets}
				dateRange={dateRange}
			/>
			<CaptureErrors errors={metrics.latest.errors} />
		</Stack>
	);
};
