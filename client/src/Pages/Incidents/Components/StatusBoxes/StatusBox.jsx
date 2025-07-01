import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { Box, Stack, Typography } from "@mui/material";
import Background from "../../../../assets/Images/background-grid.svg?react";
import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

const StatusBox = ({ title, value, status }) => {
	const theme = useTheme();
	let sharedStyles = {
		position: "absolute",
		right: 8,
		opacity: 0.5,
		"& svg path": { stroke: theme.palette.primary.contrastTextTertiary },
	};

	let color;
	let icon;
	if (status === "up") {
		color = theme.palette.success.lowContrast;
		icon = (
			<Box sx={{ ...sharedStyles, top: 8 }}>
				<TaskAltOutlinedIcon fontSize="small"/>
			</Box>
		);
	} else if (status === "down") {
		color = theme.palette.error.lowContrast;
		icon = (
			<Box sx={{ ...sharedStyles, transform: "rotate(180deg)", top: 5 }}>
				<CancelOutlinedIcon fontSize="small"/>
			</Box>
		);
	} else if (status === "paused") {
		color = theme.palette.warning.lowContrast;
		icon = (
			<Box sx={{ ...sharedStyles, top: 12, right: 12 }}>
				<WarningAmberRoundedIcon fontSize="small"/>
			</Box>
		);
	} else {
        color = theme.palette.accent.main;
        icon = (
            <Box sx={{ ...sharedStyles, top: 12, right: 12 }}>
                <MonitorHeartOutlinedIcon fontSize="small"/>
            </Box>
        );
    }

	return (
		<Box
			position="relative"
			flex={1}
			border={1}
			backgroundColor={theme.palette.primary.main}
			borderColor={theme.palette.primary.lowContrast}
			borderRadius={theme.shape.borderRadius}
			p={theme.spacing(8)}
			overflow="hidden"
		>
			<Box
				position="absolute"
				top="-10%"
				left="5%"
			>
				<Background />
			</Box>
			<Stack direction="column">
				<Stack
					direction="row"
					alignItems="center"
					mb={theme.spacing(8)}
				>
					<Typography
						variant={"h2"}
						textTransform="uppercase"
						color={theme.palette.primary.contrastTextTertiary}
					>
						{title}
					</Typography>
					{icon}
				</Stack>
				<Stack
					direction="row"
					alignItems="flex-start"
					fontSize={36}
					fontWeight={600}
					color={color}
					gap="2px"
				>
					{value}

					<Typography
						fontSize={20}
						fontWeight={300}
						color={theme.palette.primary.contrastTextSecondary}
						sx={{
							opacity: 0.3,
						}}
					>
						#
					</Typography>
				</Stack>
			</Stack>
		</Box>
	);
};

StatusBox.propTypes = {
	title: PropTypes.string,
	value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	status: PropTypes.string,
};

export default StatusBox;