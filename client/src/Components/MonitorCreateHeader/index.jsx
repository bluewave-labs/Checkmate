import { Stack, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import SkeletonLayout from "./skeleton";
import { useTranslation } from "react-i18next";
import { useTheme } from "@emotion/react";

const CreateMonitorHeader = ({
	isAdmin,
	label = "Create new",
	shouldRender = true,
	path,
	bulkPath,
}) => {
	const navigate = useNavigate();
	const { t } = useTranslation();
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
			{bulkPath && (
				<Button
					variant="contained"
					color="accent"
					onClick={() => {
						navigate(`${bulkPath}`);
					}}
				>
					{t("bulkImport.title")}
				</Button>
			)}
		</Stack>
	);
};

export default CreateMonitorHeader;

CreateMonitorHeader.propTypes = {
	isAdmin: PropTypes.bool.isRequired,
	shouldRender: PropTypes.bool,
	path: PropTypes.string.isRequired,
	label: PropTypes.string,
	bulkPath: PropTypes.string,
};
