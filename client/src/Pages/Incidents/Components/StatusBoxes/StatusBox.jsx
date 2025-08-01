import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { Box, Stack, Typography } from "@mui/material";
import Background from "../../../../assets/Images/background-grid.svg?react";
import AlertIcon from "../../../../assets/icons/alert-icon.svg?react";
import CheckIcon from "../../../../assets/icons/check-icon.svg?react";
import CloseIcon from "../../../../assets/icons/close-icon.svg?react";
import WarningIcon from "../../../../assets/icons/warning-icon.svg?react";

const StatusBox = ({ title, value, status }) => {
	const theme = useTheme();
	let sharedStyles = {
		position: "absolute",
		right: 8,
		"& svg": {
			width: 20,
			height: 20,
			opacity: 0.9,
			"& path": { stroke: theme.palette.primary.contrastTextTertiary, strokeWidth: 1.7 },
		},
	};

	let color;
	let icon;
	if (status === "up") {
		color = theme.palette.success.lowContrast;
		icon = (
			<Box sx={{ ...sharedStyles, top: theme.spacing(6), right: theme.spacing(6) }}>
				<CheckIcon />
			</Box>
		);
	} else if (status === "down") {
		color = theme.palette.error.lowContrast;
		icon = (
			<Box sx={{ ...sharedStyles, top: theme.spacing(6), right: theme.spacing(6) }}>
				<CloseIcon />
			</Box>
		);
	} else if (status === "paused") {
		color = theme.palette.warning.lowContrast;
		icon = (
			<Box sx={{ ...sharedStyles, top: theme.spacing(6), right: theme.spacing(6) }}>
				<WarningIcon />
			</Box>
		);
	} else {
		color = theme.palette.accent.main;
		icon = (
			<Box sx={{ ...sharedStyles, top: theme.spacing(6), right: theme.spacing(6) }}>
				<AlertIcon />
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
					fontSize={theme.typography.h1.fontSize}
					fontWeight={600}
					color={color}
					gap={theme.spacing(1)}
				>
					{value}

					<Typography
						fontSize={theme.typography.label.fontSize}
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
	title: PropTypes.string.isRequired,
	value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	status: PropTypes.string,
};

export default StatusBox;
