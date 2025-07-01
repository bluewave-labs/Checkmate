import PropTypes from "prop-types";
import { Stack } from "@mui/material";
import StatusBox from "./StatusBox";
import { useTheme } from "@emotion/react";
import SkeletonLayout from "./skeleton";

const StatusBoxes = ({ shouldRender }) => {
	const theme = useTheme();
	if (!shouldRender) return <SkeletonLayout shouldRender={shouldRender} />;
	return (
		<Stack
			gap={theme.spacing(12)}
			direction="row"
			justifyContent="space-between"
		>
			<StatusBox
				title={"Total Incidents"}
				value={6}
			/>
			<StatusBox
				title={"Resolved"}
				status="up"
				value={3}
			/>
            <StatusBox
            title={"Cannot Resolve"}
            status="paused"
            value={2}
            />
            <StatusBox
            title={"Down"}
            status="down"
            value={1}
            />
		</Stack>
	);
};

StatusBoxes.propTypes = {
	shouldRender: PropTypes.bool,
};

export default StatusBoxes;