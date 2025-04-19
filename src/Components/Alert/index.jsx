import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CloseIcon from "@mui/icons-material/Close";
import "./index.css";

/**
 * Icons mapping for different alert variants.
 * @type {Object<string, JSX.Element>}
 */

const icons = {
	info: <InfoOutlinedIcon />,
	error: <ErrorOutlineOutlinedIcon />,
	warning: <WarningAmberOutlinedIcon />,
};

/**
 * @param {Object} props
 * @param {'info' | 'error' | 'warning'} props.variant - The type of alert.
 * @param {string} [props.title] - The title of the alert.
 * @param {string} [props.body] - The body text of the alert.
 * @param {boolean} [props.isToast] - Indicates if the alert is used as a toast notification.
 * @param {boolean} [props.hasIcon] - Whether to display an icon in the alert.
 * @param {function} props.onClick - Toast dismiss function.
 * @returns {JSX.Element}
 */

const Alert = ({ variant, title, body, isToast, hasIcon = true, onClick }) => {
	const theme = useTheme();
	/* TODO 
	Do we need other variants for alert?
	*/

	const text = theme.palette.secondary.contrastText;
	const border = theme.palette.alert.contrastText;
	const bg = theme.palette.alert.main;
	const icon = icons[variant];

	return (
		<Stack
			direction="row"
			justifyContent="flex-start"
			alignItems={hasIcon ? "" : "center"}
			className="alert row-stack"
			gap={theme.spacing(8)}
			sx={{
				padding: hasIcon ? theme.spacing(8) : `${theme.spacing(4)} ${theme.spacing(8)}`,
				backgroundColor: bg,
				border: `solid 1px ${border}`,
				borderRadius: theme.shape.borderRadius,
			}}
		>
			{hasIcon && <Box sx={{ color: text }}>{icon}</Box>}
			<Stack
				direction="column"
				gap="2px"
				sx={{ flex: 1 }}
			>
				{title && (
					<Typography sx={{ fontWeight: "700", color: `${text}` }}>{title}</Typography>
				)}
				{body && (
					<Typography sx={{ fontWeight: "400", color: `${text}` }}>{body}</Typography>
				)}
				{hasIcon && isToast && (
					<Button
						variant="text"
						color="info"
						onClick={onClick}
						sx={{
							fontWeight: "600",
							width: "fit-content",
							mt: theme.spacing(4),
							padding: 0,
							minWidth: 0,
						}}
					>
						Dismiss
					</Button>
				)}
			</Stack>
			{isToast && (
				<IconButton
					onClick={onClick}
					sx={{
						alignSelf: "flex-start",
						ml: "auto",
						mr: "-5px",
						mt: hasIcon ? "-5px" : 0,
						padding: "5px",
						"&:focus": {
							outline: "none",
						},
					}}
				>
					<CloseIcon
						sx={{
							fontSize: "20px",
						}}
					/>
				</IconButton>
			)}
		</Stack>
	);
};

Alert.propTypes = {
	variant: PropTypes.oneOf(["info", "error", "warning"]).isRequired,
	title: PropTypes.string,
	body: PropTypes.string,
	isToast: PropTypes.bool,
	hasIcon: PropTypes.bool,
	onClick: function (props, propName, componentName) {
		if (props.isToast && !props[propName]) {
			return new Error(
				`Prop '${propName}' is required when 'isToast' is true in '${componentName}'.`
			);
		}
		return null;
	},
};

export default Alert;
