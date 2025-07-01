import PropTypes from "prop-types";
import { Stack } from "@mui/material";
import StatusBox from "./StatusBox";
import { useTheme } from "@emotion/react";
import SkeletonLayout from "./skeleton";

const StatusBoxes = ({ isLoading, statusCounts }) => {
	const theme = useTheme();
	if (isLoading) return <SkeletonLayout shouldRender={isLoading} />;
	return (
		<Stack
			gap={theme.spacing(12)}
			direction="row"
			justifyContent="space-between"
		>
			<StatusBox
				title={"Total Incidents"}
				value={statusCounts?.total || 0}
			/>
			<StatusBox
				title={"Resolved"}
				status="up"
				value={statusCounts?.resolved || 0}
			/>
            <StatusBox
            title={"Cannot Resolve"}
            status="paused"
            value={statusCounts?.cannotResolve || 0}
            />
            <StatusBox
            title={"Down"}
            status="down"
            value={statusCounts?.down || 0}
            />
		</Stack>
	);
};

StatusBoxes.propTypes = {
	isLoading: PropTypes.bool,
	statusCounts: PropTypes.shape({
		total: PropTypes.number,
		resolved: PropTypes.number,
		cannotResolve: PropTypes.number,
		down: PropTypes.number,
	}),
};

export default StatusBoxes;