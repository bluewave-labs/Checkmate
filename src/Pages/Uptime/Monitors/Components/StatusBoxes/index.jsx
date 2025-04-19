import PropTypes from "prop-types";
import { Stack } from "@mui/material";
import StatusBox from "./statusBox";
import { useTheme } from "@emotion/react";
import SkeletonLayout from "./skeleton";

const StatusBoxes = ({ shouldRender, monitorsSummary }) => {
	const theme = useTheme();
	if (!shouldRender) return <SkeletonLayout shouldRender={shouldRender} />;
	return (
		<Stack
			gap={theme.spacing(8)}
			direction="row"
			justifyContent="space-between"
		>
			<StatusBox
				title="up"
				value={monitorsSummary?.upMonitors ?? 0}
			/>
			<StatusBox
				title="down"
				value={monitorsSummary?.downMonitors ?? 0}
			/>
			<StatusBox
				title="paused"
				value={monitorsSummary?.pausedMonitors ?? 0}
			/>
		</Stack>
	);
};

StatusBoxes.propTypes = {
	monitorsSummary: PropTypes.object,
};

export default StatusBoxes;
