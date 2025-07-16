import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ToastBody from "./body";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CloseIcon from "@mui/icons-material/Close";

// Utils
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";

const icons = {
	info: <InfoOutlinedIcon />,
	error: <ErrorOutlineOutlinedIcon />,
	warning: <WarningAmberOutlinedIcon />,
};

const Toast = ({ variant, title, body, onClick, hasDismiss, hasIcon }) => {
	const theme = useTheme();
	const icon = icons[variant];

	return (
		<Stack
			gap={theme.spacing(2)}
			paddingTop={theme.spacing(4)}
			paddingRight={theme.spacing(8)}
			paddingBottom={theme.spacing(4)}
			paddingLeft={theme.spacing(8)}
			backgroundColor={theme.palette.alert.main}
			border={`solid 1px ${theme.palette.alert.contrastText}`}
			borderRadius={theme.shape.borderRadius}
		>
			<Stack
				direction="row"
				gap={theme.spacing(8)}
				justifyContent="space-between"
				alignItems="center"
			>
				{hasIcon && icon}
				{title && (
					<Typography
						fontWeight="700"
						color={theme.palette.secondary.contrastText}
					>
						{title}
					</Typography>
				)}
				{title && (
					<IconButton onClick={onClick}>
						<CloseIcon />
					</IconButton>
				)}
			</Stack>

			<Stack
				direction="row"
				gap={theme.spacing(2)}
				alignItems="center"
			>
				<ToastBody body={body} />
				{!title && (
					<IconButton onClick={onClick}>
						<CloseIcon />
					</IconButton>
				)}
			</Stack>
			{hasDismiss && (
				<Button
					variant="text"
					color="info"
					onClick={onClick}
					sx={{
						fontWeight: "600",
						width: "fit-content",
					}}
				>
					Dismiss
				</Button>
			)}
		</Stack>
	);
};

export default Toast;

Toast.propTypes = {
	variant: PropTypes.string.isRequired,
	title: PropTypes.string,
	body: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
	hasDismiss: PropTypes.bool,
	hasIcon: PropTypes.bool,
	onClick: PropTypes.func,
};
