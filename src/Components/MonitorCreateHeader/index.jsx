import { Stack, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";
import SkeletonLayout from "./skeleton";
import { useTranslation } from "react-i18next";

const CreateMonitorHeader = ({
	isAdmin,
	label = "Create new",
	shouldRender = true,
	path,
}) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const theme = useTheme();

	if (!isAdmin) return null;
	if (!shouldRender) return <SkeletonLayout />;
	return (
		<Stack
			direction="row"
			justifyContent="end"
			alignItems="center"
			gap={theme.spacing(6)}
		>
			<Button
				variant="contained"
				color="accent"
				onClick={() => navigate(path)}
			>
				{label}
			</Button>
			<Button
				variant="contained"
				color="accent"
				onClick={() => {
					navigate("/uptime/bulk-import");
				}}
			>
				{t("uptime.bulkImport.title")}
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
