// Components
import { Box, Stack, Typography, Button } from "@mui/material";
import Image from "../../../../../Components/Image";
import SettingsIcon from "../../../../../assets/icons/settings-bold.svg?react";

//Utils
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";

const Controls = ({ isDeleteOpen, setIsDeleteOpen, isDeleting, monitorId }) => {
	const theme = useTheme();
	const navigate = useNavigate();

	return (
		<Stack
			direction="row"
			gap={theme.spacing(2)}
		>
			<Box>
				<Button
					variant="contained"
					color="error"
					onClick={() => setIsDeleteOpen(!isDeleteOpen)}
					loading={isDeleting}
				>
					Delete
				</Button>
			</Box>
			<Box>
				<Button
					variant="contained"
					color="secondary"
					onClick={() => {
						navigate(`/distributed-uptime/configure/${monitorId}`);
					}}
					sx={{
						px: theme.spacing(5),
						"& svg": {
							mr: theme.spacing(3),
							"& path": {
								stroke: theme.palette.secondary.contrastText,
							},
						},
					}}
				>
					<SettingsIcon /> Configure
				</Button>
			</Box>
		</Stack>
	);
};

Controls.propTypes = {
	isDeleting: PropTypes.bool,
	monitorId: PropTypes.string,
	isDeleteOpen: PropTypes.bool.isRequired,
	setIsDeleteOpen: PropTypes.func.isRequired,
};

const ControlsHeader = ({ isDeleting, isDeleteOpen, setIsDeleteOpen, monitorId }) => {
	const theme = useTheme();

	return (
		<Stack
			alignSelf="flex-start"
			direction="row"
			width="100%"
			gap={theme.spacing(2)}
			justifyContent="flex-end"
			alignItems="flex-end"
		>
			<Controls
				isDeleting={isDeleting}
				isDeleteOpen={isDeleteOpen}
				setIsDeleteOpen={setIsDeleteOpen}
				monitorId={monitorId}
			/>
		</Stack>
	);
};

ControlsHeader.propTypes = {
	monitorId: PropTypes.string,
	isDeleting: PropTypes.bool,
	isDeleteOpen: PropTypes.bool.isRequired,
	setIsDeleteOpen: PropTypes.func.isRequired,
};

export default ControlsHeader;
