import Stack from "@mui/material/Stack";
import { SummaryBoxes } from "@/Pages/Infrastructure/Metrics/Components/SummaryBoxes";

import { useTheme } from "@mui/material";
import type { HardwareMetricsResponse } from "@/Types/Monitor";
import { LAYOUT } from "@/Utils/Theme/constants";

export const TabOverview = ({ metrics }: { metrics: HardwareMetricsResponse | null }) => {
	const theme = useTheme();
	if (!metrics?.latest) {
		return null;
	}

	return (
		<Stack gap={theme.spacing(LAYOUT.LG)}>
			<SummaryBoxes latest={metrics.latest} />
		</Stack>
	);
};
