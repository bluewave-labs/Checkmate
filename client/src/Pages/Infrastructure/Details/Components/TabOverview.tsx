import Stack from "@mui/material/Stack";
import { InfraDetailsGauges } from "@/Pages/Infrastructure/Details/Components/Gauges";
import { StatusBoxes } from "@/Pages/Infrastructure/Details/Components/StatusBoxes";
import { InfraDetailsCharts } from "@/Pages/Infrastructure/Details/Components/Charts";

import { useTheme } from "@mui/material";
import type { HardwareStats, Monitor } from "@/Types/Monitor";

export const TabOverview = ({
	monitor,
	stats,
	dateRange,
}: {
	monitor: Monitor | undefined;
	stats: HardwareStats | undefined;
	dateRange: string;
}) => {
	const theme = useTheme();
	if (!monitor) {
		return null;
	}

	const checks = stats?.checks || [];
	return (
		<Stack gap={theme.spacing(8)}>
			<StatusBoxes monitor={monitor} />
			<InfraDetailsGauges snapshot={monitor.recentChecks?.[0]} />
			<InfraDetailsCharts
				checks={checks}
				dateRange={dateRange}
			/>
		</Stack>
	);
};
