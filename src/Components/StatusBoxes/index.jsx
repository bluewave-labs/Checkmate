// Components
import { Stack } from "@mui/material";
import SkeletonLayout from "./skeleton";
// Utils
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";
const StatusBoxes = ({ shouldRender, flexWrap = "nowrap", children }) => {
	const theme = useTheme();
	if (!shouldRender) {
		return (
			<SkeletonLayout
				numBoxes={children?.length ?? 1}
				flexWrap={flexWrap}
			/>
		);
	}

	return (
		<Stack
			direction="row"
			flexWrap={flexWrap}
			gap={theme.spacing(8)}
		>
			{children}
		</Stack>
	);
};

StatusBoxes.propTypes = {
	shouldRender: PropTypes.bool,
	children: PropTypes.node,
};

export default StatusBoxes;
