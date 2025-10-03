import {
	BasePage,
	UpStatusBox,
	DownStatusBox,
	PausedStatusBox,
} from "@/Components/v2/DesignElements";
import { HeaderCreate } from "@/Components/v2/Monitors";
import Stack from "@mui/material/Stack";
import { MonitorTable } from "@/Pages/v2/Uptime/MonitorTable";

import { useTheme } from "@mui/material/styles";
import { useGet } from "@/Hooks/v2/UseApi";
import type { ApiResponse } from "@/Hooks/v2/UseApi";
import type { IMonitor } from "@/Types/Monitor";
import { useMediaQuery } from "@mui/material";

const UptimeMonitors = () => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));

	const { response, error, loading, refetch } = useGet<ApiResponse>(
		"/monitors?embedChecks=true"
	);
	const monitors = response?.data ?? ([] as IMonitor[]);

	if (monitors.length === 0 && !loading) {
		return "No monitors found";
	}

	return (
		<BasePage>
			<HeaderCreate
				isLoading={loading}
				path="/v2/uptime/create"
			/>
			<Stack
				direction={isSmall ? "column" : "row"}
				gap={theme.spacing(8)}
			>
				<UpStatusBox n={1} />
				<DownStatusBox n={1} />
				<PausedStatusBox n={1} />
			</Stack>
			<MonitorTable monitors={monitors} />
		</BasePage>
	);
};

export default UptimeMonitors;
