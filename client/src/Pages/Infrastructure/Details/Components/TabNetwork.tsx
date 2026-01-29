import Stack from "@mui/material/Stack";
import { InfraNetworkCharts } from "./ChartsNetwork";

import { useTheme } from "@mui/material";
import type { HardwareStats } from "@/Types/Monitor";

export const TabNetwork = ({
	stats,
	dateRange,
}: {
	stats: HardwareStats | undefined;
	dateRange: string;
}) => {
	const theme = useTheme();

	if (!stats) {
		return null;
	}

	const checks = stats?.checks || [];
	return (
		<Stack gap={theme.spacing(8)}>
			<InfraNetworkCharts
				checks={checks}
				dateRange={dateRange}
			/>
		</Stack>
	);
};
