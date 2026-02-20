import {
	UpStatusBox,
	DownStatusBox,
	PausedStatusBox,
	InitializingStatusBox,
	BreachedStatusBox,
} from "@/Components/design-elements";
import Stack from "@mui/material/Stack";

import type { MonitorsSummary } from "@/Types/Monitor";
import { useTheme } from "@mui/material";

interface MonitorsSummaryProps {
	summary: MonitorsSummary | null;
	showBreached?: boolean;
}

export const HeaderMonitorsSummary = ({
	summary,
	showBreached = false,
}: MonitorsSummaryProps) => {
	const theme = useTheme();
	return (
		<Stack
			direction={{ xs: "column", md: "row" }}
			gap={theme.spacing(8)}
		>
			<UpStatusBox n={summary?.upMonitors || 0} />
			<DownStatusBox n={summary?.downMonitors || 0} />
			{showBreached && <BreachedStatusBox n={summary?.breachedMonitors || 0} />}
			<PausedStatusBox n={summary?.pausedMonitors || 0} />
			<InitializingStatusBox n={summary?.initializingMonitors || 0} />
		</Stack>
	);
};
