import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ConfigBox from "@/Components/v1/ConfigBox/index.jsx";
// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";
import Dialog from "@/Components/v1/Dialog/index.jsx";
import { useState } from "react";

const SettingsDemoMonitors = ({ isAdmin, HEADER_SX, handleChange, isLoading }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	// Local state
	const [isOpen, setIsOpen] = useState(false);

	if (!isAdmin) {
		return null;
	}

	return (
		<>
			<ConfigBox>
				<Box>
					<Typography
						component="h1"
						variant="h2"
					>
						Export monitors to JSON
					</Typography>
					<Typography sx={HEADER_SX}>
						Export your monitors data as a JSON file for backup or transfer.
					</Typography>
				</Box>
				<Box>
					<Button
						variant="contained"
						color="accent"
						loading={isLoading}
						onClick={() => {
							const syntheticEvent = {
								target: {
									name: "export",
								},
							};
							handleChange(syntheticEvent);
						}}
						sx={{ mt: theme.spacing(4) }}
					>
						Export Monitors to JSON
					</Button>
				</Box>
			</ConfigBox>
		</>
	);
};

SettingsDemoMonitors.propTypes = {
	isAdmin: PropTypes.bool,
	handleChange: PropTypes.func,
	HEADER_SX: PropTypes.object,
};

export default SettingsDemoMonitors;
