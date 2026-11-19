import Stack from "@mui/material/Stack";
import { InfraNetworkCharts } from "./ChartsNetwork";

import { useTheme } from "@mui/material";
import type { HardwareStats } from "@/Types/Monitor";
import { LAYOUT } from "@/Utils/Theme/constants";

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
		<Stack gap={theme.spacing(LAYOUT.LG)}>
			<InfraNetworkCharts
				checks={checks}
				dateRange={dateRange}
			/>
		</Stack>
	);
};
