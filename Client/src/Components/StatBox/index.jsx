import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";
import useUtils from "../../Pages/Uptime/Home/Hooks/useUtils";

/**
 * StatBox Component
 *
 * A reusable component that displays a statistic with a heading and subheading
 * in a styled box with a gradient background.
 *
 * @component
 * @param {Object} props - The component props
 * @param {string} props.heading - The primary heading/title of the statistic
 * @param {string|React.ReactNode} props.subHeading - The value or description of the statistic
 * @param {boolean} [props.gradient=false] - Determines if the box should have a gradient background
 * @param {string} [props.status] - The status of the statistic
 * @param {Object} [props.sx] - Additional custom styling to be applied to the box
 *
 * @example
 * return (
 *   <StatBox
 *     heading="Total Users"
 *     subHeading="1,234"
 *     sx={{ width: 300 }}
 *   />
 * )
 *
 * @returns {React.ReactElement} A styled box containing the statistic
 */

const StatBox = ({ heading, subHeading, gradient = false, status = "", sx }) => {
	const theme = useTheme();
	const { statusToTheme } = useUtils();
	const themeColor = statusToTheme[status];

	const statusBoxStyles = gradient
		? {
				background: `linear-gradient(to bottom right, ${theme.palette[themeColor].main} 30%, ${theme.palette[themeColor].lowContrast} 70%)`,
				borderColor: theme.palette[themeColor].lowContrast,
			}
		: {
				background: `linear-gradient(340deg, ${theme.palette.tertiary.main} 20%, ${theme.palette.primary.main} 45%)`,
				borderColor: theme.palette.primary.lowContrast,
			};

	const headingStyles = gradient
		? {
				color: theme.palette[themeColor].contrastText,
			}
		: {
				color: theme.palette.primary.contrastTextSecondary,
			};

	const spanFixedStyles = { marginLeft: theme.spacing(2), fontSize: 15 };
	const detailTextStyles = gradient
		? {
				color: theme.palette[themeColor].contrastText,
				"& span": {
					color: theme.palette[themeColor].contrastText,
					...spanFixedStyles,
				},
			}
		: {
				color: theme.palette.primary.contrastText,
				"& span": {
					color: theme.palette.primary.contrastTextTertiary,
					...spanFixedStyles,
				},
			};

	return (
		<Box
			sx={{
				padding: `${theme.spacing(4)} ${theme.spacing(8)}`,
				/* TODO why are we using width and min width here? */
				minWidth: 200,
				width: 225,
				border: 1,
				borderStyle: "solid",
				borderRadius: 4,
				...statusBoxStyles,
				"& h2": {
					/* TODO font size should come from theme */
					fontSize: 13,
					fontWeight: 500,
					textTransform: "uppercase",
					...headingStyles,
				},
				"& p": {
					fontSize: 18,
					marginTop: theme.spacing(2),
					...detailTextStyles,
				},
				...sx,
			}}
		>
			<Typography component="h2">{heading}</Typography>
			<Typography>{subHeading}</Typography>
		</Box>
	);
};

StatBox.propTypes = {
	heading: PropTypes.string.isRequired,
	subHeading: PropTypes.node.isRequired,
	gradient: PropTypes.bool,
	status: PropTypes.string,
	sx: PropTypes.object,
};

export default StatBox;
