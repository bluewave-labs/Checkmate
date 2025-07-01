import PropTypes from "prop-types";
import { Stack } from "@mui/material";
import StatusBox from "./StatusBox";
import { useTheme } from "@emotion/react";
import SkeletonLayout from "./skeleton";

const StatusBoxes = ({ isLoading, summary }) => {
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
				value={summary?.totalChecks || 0}
			/>
			<StatusBox
				title={"Resolved"}
				status="up"
				value={summary?.resolvedChecks || 0}
			/>
			<StatusBox
				title={"Cannot Resolve"}
				status="paused"
				value={summary?.cannotResolveChecks || 0}
			/>
			<StatusBox
				title={"Down"}
				status="down"
				value={summary?.downChecks || 0}
			/>
		</Stack>
	);
};

StatusBoxes.propTypes = {
	isLoading: PropTypes.bool,
	summary: PropTypes.object,
};

export default StatusBoxes;
