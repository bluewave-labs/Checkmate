import { Stack, Typography, Button, ButtonGroup } from "@mui/material";
import { useTheme } from "@emotion/react";
import SkeletonLayout from "./skeleton";
import PropTypes from "prop-types";

const MonitorTimeFrameHeader = ({
	isLoading = false,
	hasDateRange = true,
	dateRange,
	setDateRange,
}) => {
	const theme = useTheme();

	if (isLoading) {
		return <SkeletonLayout />;
	}

	let timeFramePicker = null;

	if (hasDateRange) {
		timeFramePicker = (
			<ButtonGroup sx={{ height: 32 }}>
				<Button
					variant="group"
					filled={(dateRange === "recent").toString()}
					onClick={() => setDateRange("recent")}
				>
					Recent
				</Button>
				<Button
					variant="group"
					filled={(dateRange === "day").toString()}
					onClick={() => setDateRange("day")}
				>
					Day
				</Button>
				<Button
					variant="group"
					filled={(dateRange === "week").toString()}
					onClick={() => setDateRange("week")}
				>
					Week
				</Button>
				<Button
					variant="group"
					filled={(dateRange === "month").toString()}
					onClick={() => setDateRange("month")}
				>
					Month
				</Button>
			</ButtonGroup>
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

MonitorTimeFrameHeader.propTypes = {
	isLoading: PropTypes.bool,
	hasDateRange: PropTypes.bool,
	dateRange: PropTypes.string,
	setDateRange: PropTypes.func,
};

export default MonitorTimeFrameHeader;
