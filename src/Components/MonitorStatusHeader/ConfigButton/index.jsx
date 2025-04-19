import { Button, Box } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import SettingsIcon from "../../../assets/icons/settings-bold.svg?react";
import PropTypes from "prop-types";
const ConfigButton = ({ shouldRender = true, monitorId, path }) => {
	const theme = useTheme();
	const navigate = useNavigate();

	if (!shouldRender) return null;

	return (
		<Box alignSelf="flex-end">
			<Button
				variant="contained"
				color="secondary"
				onClick={() => navigate(`/${path}/configure/${monitorId}`)}
				sx={{
					px: theme.spacing(5),
					"& svg": {
						mr: theme.spacing(3),
						"& path": {
							/* Should always be contrastText for the button color */
							stroke: theme.palette.secondary.contrastText,
						},
					},
				}}
			>
				<SettingsIcon /> Configure
			</Button>
		</Box>
	);
};

ConfigButton.propTypes = {
	shouldRender: PropTypes.bool,
	monitorId: PropTypes.string.isRequired,
	path: PropTypes.string.isRequired,
};

export default ConfigButton;
