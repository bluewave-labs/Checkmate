import Stack from "@mui/material/Stack";
import { MonitorStatus } from "@/Components/v2/design-elements";

import type { Monitor } from "@/Types/Monitor.js";

interface HeaderMonitorControlsProps {
	monitor: Monitor;
}

export const HeaderMonitorControls = ({ monitor }: HeaderMonitorControlsProps) => {
	return (
		<Stack
			direction="row"
			justifyContent={"space-between"}
		>
			<MonitorStatus monitor={monitor} />
		</Stack>
	);
};
