import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ToggleButtonGroup, ToggleButton } from "@/Components/inputs";
import { useTheme } from "@mui/material/styles";
import CircularProgress from "@mui/material/CircularProgress";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "@mui/material";
import { DefaultHeaderDateRanges, type DateRange } from "@/Types/Query";
import { LAYOUT } from "@/Utils/Theme/constants";

interface MonitorTimeFrameHeaderProps {
	isLoading?: boolean;
	hasDateRange?: boolean;
	dateRange: DateRange;
	setDateRange: (dateRange: DateRange) => void;
	ranges?: readonly DateRange[];
}

export const HeaderTimeRange = ({
	isLoading = false,
	hasDateRange = true,
	dateRange,
	setDateRange,
	ranges = DefaultHeaderDateRanges,
}: MonitorTimeFrameHeaderProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
	const handleChange = (
		_event: React.MouseEvent<HTMLElement>,
		newValue: DateRange | null
	) => {
		if (newValue !== null) {
			setDateRange(newValue);
		}
	};

	let timeFramePicker = null;

	if (hasDateRange) {
		timeFramePicker = (
			<ToggleButtonGroup
				orientation={isSmallScreen ? "vertical" : "horizontal"}
				value={dateRange}
				exclusive
				onChange={handleChange}
				size="small"
				fullWidth={isSmallScreen}
			>
				{ranges.map((range) => (
					<ToggleButton
						key={range}
						value={range}
					>
						{t(`components.headerTimeRange.labels.${range}`)}
					</ToggleButton>
				))}
			</ToggleButtonGroup>
		);
	}

	return (
		<Stack
			direction={{ xs: "column", md: "row" }}
			justifyContent="flex-end"
			alignItems="center"
			gap={theme.spacing(LAYOUT.XS)}
		>
			<Box
				width={16}
				height={16}
			>
				{isLoading && <CircularProgress size={16} />}
			</Box>
			<Typography>{t(`components.headerTimeRange.description.${dateRange}`)}</Typography>
			{timeFramePicker}
		</Stack>
	);
};
