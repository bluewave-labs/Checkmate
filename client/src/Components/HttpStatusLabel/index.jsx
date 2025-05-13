import PropTypes from "prop-types";
import { useTheme } from "@mui/material";
import { BaseLabel } from "../Label";

/**
 * @component
 * @param {Object} props
 * @param {number} props.status - The http status for the label
 * @param {Styles} props.customStyles - CSS Styles passed from parent component
 * @returns {JSX.Element}
 * @example
 * // Render a http status label
 * <HttpStatusLabel status={404} />
 */

const DEFAULT_CODE = 9999; // Default code for unknown status

const handleStatusCode = (status) => {
	if (status) {
		return status;
	}
	return DEFAULT_CODE;
};

const getRoundedStatusCode = (status) => {
	return Math.floor(status / 100) * 100;
};

const HttpStatusLabel = ({ status, customStyles }) => {
	const theme = useTheme();
	const colors = {
		400: {
			color: theme.palette.warning.main,
			borderColor: theme.palette.warning.lowContrast,
		},
		500: {
			color: theme.palette.error.main,
			borderColor: theme.palette.error.lowContrast,
		},
		default: {
			color: theme.palette.primary.contrastText,
			borderColor: theme.palette.primary.contrastText,
		},
	};

	const statusCode = handleStatusCode(status);

	const { borderColor, color } =
		colors[getRoundedStatusCode(statusCode)] || colors.default;
	return (
		<BaseLabel
			label={String(statusCode)}
			styles={{
				color: color,
				borderColor: borderColor,
				...customStyles,
			}}
		/>
	);
};

HttpStatusLabel.propTypes = {
	status: PropTypes.number,
	customStyles: PropTypes.object,
};

export { HttpStatusLabel };
