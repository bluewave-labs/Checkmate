import { Stack, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import SkeletonLayout from "./skeleton";

const CreateMonitorHeader = ({
	isAdmin,
	label = "Create new",
	shouldRender = true,
	path,
}) => {
	const navigate = useNavigate();
	if (!isAdmin) return null;
	if (!shouldRender) return <SkeletonLayout />;
	return (
		<Stack
			direction="row"
			justifyContent="end"
			alignItems="center"
		>
			<Button
				variant="contained"
				color="accent"
				onClick={() => navigate(path)}
			>
				{label}
			</Button>
		</Stack>
	);
};

export default CreateMonitorHeader;

CreateMonitorHeader.propTypes = {
	isAdmin: PropTypes.bool.isRequired,
	shouldRender: PropTypes.bool,
	path: PropTypes.string.isRequired,
	label: PropTypes.string,
};
