import { Stack, Typography, InputAdornment, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Visibility from "@mui/icons-material/Visibility";
import ReorderRoundedIcon from "@mui/icons-material/ReorderRounded";
import DeleteIcon from "../../../../assets/icons/trash-bin.svg?react";

export const HttpAdornment = ({ https }) => {
	const theme = useTheme();
	return (
		<Stack
			direction="row"
			alignItems="center"
			height="100%"
			sx={{
				borderRight: `solid 1px ${theme.palette.primary.lowContrast}`,
				backgroundColor: theme.palette.tertiary.main,
				pl: theme.spacing(6),
			}}
		>
			<Typography
				component="h5"
				paddingRight={"var(--env-var-spacing-1-minus)"}
				color={theme.palette.primary.contrastTextSecondary}
				sx={{ lineHeight: 1, opacity: 0.8 }}
			>
				{https ? "https" : "http"}
			</Typography>
		</Stack>
	);
};

HttpAdornment.propTypes = {
	https: PropTypes.bool.isRequired,
	prefix: PropTypes.string,
};

export const PasswordEndAdornment = ({ fieldType, setFieldType }) => {
	const theme = useTheme();
	return (
		<InputAdornment position="end">
			<IconButton
				aria-label="toggle password visibility"
				onClick={() => setFieldType(fieldType === "password" ? "text" : "password")}
				sx={{
					color: theme.palette.primary.lowContrast,
					padding: theme.spacing(1),
					"&:focus-visible": {
						outline: `2px solid ${theme.palette.primary.main}`,
						outlineOffset: `2px`,
					},
					"& .MuiTouchRipple-root": {
						pointerEvents: "none",
						display: "none",
					},
				}}
			>
				{fieldType === "password" ? <VisibilityOff /> : <Visibility />}
			</IconButton>
		</InputAdornment>
	);
};

PasswordEndAdornment.propTypes = {
	fieldType: PropTypes.string,
	setFieldType: PropTypes.func,
};
