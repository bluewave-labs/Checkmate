import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ToggleButtonGroup, ToggleButton } from "@/Components/v2/inputs";
import { useTheme } from "@mui/material/styles";

interface MonitorTimeFrameHeaderProps {
	isLoading?: boolean;
	hasDateRange?: boolean;
	dateRange: string;
	setDateRange: (dateRange: string) => void;
}

export const HeaderTimeRange = ({
	isLoading = false,
	hasDateRange = true,
	dateRange,
	setDateRange,
}: MonitorTimeFrameHeaderProps) => {
	const theme = useTheme();

	const handleChange = (
		_event: React.MouseEvent<HTMLElement>,
		newValue: string | null
	) => {
		if (newValue !== null) {
			setDateRange(newValue);
		}
	};

	let timeFramePicker = null;

	if (hasDateRange) {
		timeFramePicker = (
			<ToggleButtonGroup
				value={dateRange}
				exclusive
				onChange={handleChange}
				size="small"
			>
				<ToggleButton
					disabled={isLoading}
					value="recent"
				>
					Recent
				</ToggleButton>
				<ToggleButton
					disabled={isLoading}
					value="day"
				>
					Day
				</ToggleButton>
				<ToggleButton
					disabled={isLoading}
					value="week"
				>
					Week
				</ToggleButton>
				<ToggleButton
					disabled={isLoading}
					value="month"
				>
					Month
				</ToggleButton>
			</ToggleButtonGroup>
		);
	}

	return (
		<Stack
			direction="row"
			justifyContent="flex-end"
			alignItems="center"
			gap={theme.spacing(4)}
		>
			<Typography variant="body2">
				Showing statistics for past{" "}
				{dateRange === "recent"
					? "2 hours"
					: dateRange === "day"
						? "24 hours"
						: dateRange === "week"
							? "7 days"
							: "30 days"}
				.
			</Typography>
			{timeFramePicker}
		</Stack>
	);
};
