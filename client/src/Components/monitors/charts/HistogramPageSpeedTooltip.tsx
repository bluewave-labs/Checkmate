import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { TooltipProps } from "recharts";
import { useTheme } from "@mui/material/styles";
import { useFormatDate } from "@/Hooks/useFormatDate";
import { RADIUS } from "@/Utils/Theme/constants";

export const HistogramPageSpeedTooltip = ({
	active,
	payload,
}: TooltipProps<number, string>) => {
	const theme = useTheme();
	const formatDate = useFormatDate();

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
				borderRadius: RADIUS.SM,
				p: theme.spacing(4),
			}}
		>
			<Typography>{formatDate(data?.date, "dateTime")}</Typography>
			<Typography>Score: {data?.score}</Typography>
		</Stack>
	);
};
