import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ToggleButtonGroup, ToggleButton } from "@/Components/v2/inputs";
import { useTheme } from "@mui/material/styles";
import CircularProgress from "@mui/material/CircularProgress";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";

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
	const { t } = useTranslation();
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
				<ToggleButton value="recent">
					{t("components.headerTimeRange.labels.recent")}
				</ToggleButton>
				<ToggleButton value="day">
					{t("components.headerTimeRange.labels.day")}
				</ToggleButton>
				<ToggleButton value="week">
					{t("components.headerTimeRange.labels.week")}
				</ToggleButton>
				<ToggleButton value="month">
					{t("components.headerTimeRange.labels.month")}
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
			{isLoading && <CircularProgress size={16} />}
			<Typography variant="body2">
				{t(`components.headerTimeRange.description.${dateRange}`)}
			</Typography>
			{timeFramePicker}
		</Stack>
	);
};
