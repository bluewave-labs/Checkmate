import Stack from "@mui/material/Stack";
import { InfraDetailsGauges } from "@/Pages/Infrastructure/Details/Components/Gauges";
import { StatusBoxes } from "@/Pages/Infrastructure/Details/Components/StatusBoxes";
import { InfraDetailsCharts } from "@/Pages/Infrastructure/Details/Components/Charts";

import { useTheme } from "@mui/material";
import type { HardwareStats, LatestDrives, LatestRaid, Monitor } from "@/Types/Monitor";

export const TabOverview = ({
	monitor,
	stats,
	dateRange,
	raid,
	drives,
}: {
	monitor: Monitor | undefined;
	stats: HardwareStats | undefined;
	dateRange: string;
	raid?: LatestRaid | null;
	drives?: LatestDrives | null;
}) => {
	const theme = useTheme();
	if (!monitor) {
		return null;
	}

	const checks = stats?.checks || [];
	const recentChecks = monitor.recentChecks ?? [];
	return (
		<Stack gap={theme.spacing(8)}>
			<StatusBoxes
				monitor={monitor}
				raid={raid}
				drives={drives}
			/>
			<InfraDetailsGauges snapshot={recentChecks[recentChecks.length - 1]} />
			<InfraDetailsCharts
				checks={checks}
				dateRange={dateRange}
			/>
		</Stack>
	);
};
