import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import type { TooltipProps } from "recharts";
import { useTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";
import type { RootState } from "@/Types/state";

export const HistogramPageSpeedTooltip = ({
	active,
	payload,
}: TooltipProps<number, string>) => {
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);
	const theme = useTheme();

	if (!active || !payload || payload.length === 0) {
		return null;
	}

	const data = payload[0]?.payload;

	return (
		<Stack
			alignItems="flex-start"
			sx={{
				backgroundColor: theme.palette.secondary.main,
				border: 1,
				borderColor: theme.palette.divider,
				borderRadius: theme.shape.borderRadius,
				p: theme.spacing(4),
			}}
		>
			<Typography>
				{formatDateWithTz(data?.date, "ddd, MMMM D, YYYY, HH:mm A", uiTimezone)}
			</Typography>
			<Typography>Score: {data?.score}</Typography>
		</Stack>
	);
};
