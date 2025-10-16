import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import { useSelector } from "react-redux";
import type { LatestCheck } from "@/Types/Check";

export const HistogramResponseTimeTooltip: React.FC<{
	children: React.ReactElement;
	check: LatestCheck;
}> = ({ children, check }) => {
	const uiTimezone = useSelector((state: any) => state.ui.timezone);
	return (
		<Tooltip
			title={
				<Stack>
					<Typography>
						{formatDateWithTz(check?.checkedAt, "ddd, MMMM D, YYYY, HH:mm A", uiTimezone)}
					</Typography>
					{check?.responseTime && (
						<Typography>Response Time: {check.responseTime} ms</Typography>
					)}
				</Stack>
			}
		>
			{children}
		</Tooltip>
	);
};
