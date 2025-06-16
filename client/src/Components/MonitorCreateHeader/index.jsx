import { Stack, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { useTheme } from "@emotion/react";
import { useExportMonitors } from "../../Hooks/monitorHooks";

const CreateMonitorHeader = ({ isAdmin, label, isLoading = true, path, bulkPath }) => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const theme = useTheme();
	const [exportMonitors, isExporting] = useExportMonitors()

	// Use the provided label or fall back to the translated default

	if (!isAdmin) return null;

	return (
		<Stack
			direction="row"
			justifyContent="end"
			alignItems="center"
			gap={theme.spacing(6)}
		>
			<Button
				loading={isLoading}
				variant="contained"
				color="accent"
				onClick={() => navigate(path)}
			>
				{label || t("createNew")}
			</Button>
			{bulkPath && (
				<>
					<Button
						loading={isLoading}
						variant="contained"
						color="accent"
						onClick={() => {
							navigate(`${bulkPath}`);
						}}
					>
						{t("bulkImport.title")}
					</Button>

					<Button
						loading={isExporting}
						variant="contained"
						color="accent"
						onClick={exportMonitors}
					>
						{t("export.title")}
					</Button>
				</>
			)}
		</Stack>
	);
};

export default CreateMonitorHeader;

CreateMonitorHeader.propTypes = {
	isAdmin: PropTypes.bool.isRequired,
	isLoading: PropTypes.bool,
	path: PropTypes.string.isRequired,
	label: PropTypes.string,
	bulkPath: PropTypes.string,
};
