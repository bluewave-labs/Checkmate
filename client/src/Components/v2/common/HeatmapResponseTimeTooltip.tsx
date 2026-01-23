import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import type { Check } from "@/Types/Check";
import { useTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";
import type { RootState } from "@/Types/state";

type HeatmapCheck = Check | { status: "placeholder"; responseTime: 0; createdAt: "" };

export const HeatmapResponseTimeTooltip = ({
	children,
	check,
}: {
	children: React.ReactElement;
	check: HeatmapCheck;
}) => {
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);
	const theme = useTheme();

	const getColor = (status: boolean) => {
		if (status === true) return theme.palette.success.light;
		if (status === false) return theme.palette.error.light;
	};

	if (check.status === "placeholder") {
		return children;
	}

	return (
		<Tooltip
			slotProps={{
				tooltip: {
					sx: {
						backgroundColor: "transparent",
						color: "inherit",
						boxShadow: "none",
					},
				},
			}}
			title={
				<Stack
					sx={{
						backgroundColor: theme.palette.secondary.main,
						border: 1,
						borderColor: theme.palette.divider,
						borderRadius: theme.shape.borderRadius,
						p: theme.spacing(4),
					}}
				>
					<Typography>
						{formatDateWithTz(check?.createdAt, "ddd, MMMM D, YYYY, HH:mm A", uiTimezone)}
					</Typography>
					{check?.originalResponseTime && (
						<Typography>
							Response Time: {check.originalResponseTime.toFixed()} ms
						</Typography>
					)}

					<Typography textTransform={"capitalize"}>
						Status:{" "}
						<span style={{ color: getColor(check?.status) }}>{check?.status}</span>
					</Typography>
				</Stack>
			}
		>
			{children}
		</Tooltip>
	);
};
