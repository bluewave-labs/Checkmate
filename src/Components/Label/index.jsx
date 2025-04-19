import PropTypes from "prop-types";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material";
import "./index.css";

/**
 * @typedef {Object} Styles
 * @param {string} [color] - The text color
 * @param {string} [backgroundColor] - The background color
 * @param {string} [borderColor] - The border color
 */

/**
 * @component
 * @param {Object} props
 * @param {string} props.label - The label of the label
 * @param {Styles} props.styles - CSS Styles passed from parent component
 * @param {React.ReactNode} children - Children passed from parent component
 * @returns {JSX.Element}
 */

const BaseLabel = ({ label, styles, children }) => {
	const theme = useTheme();
	// Grab the default borderRadius from the theme to match button style
	const { borderRadius } = theme.shape;
	// Calculate padding for the label to mimic button.  Appears to scale correctly, not 100% sure though.
	const padding = theme.spacing(3, 5);

	return (
		<Box
			className="label"
			sx={{
				borderRadius: borderRadius,
				border: `1px solid ${theme.palette.primary.lowContrast}`,
				color: theme.palette.primary.contrastText,
				padding: padding,
				...styles,
			}}
		>
			{children}
			{label}
		</Box>
	);
};

BaseLabel.propTypes = {
	label: PropTypes.string.isRequired,
	styles: PropTypes.shape({
		color: PropTypes.string,
		backgroundColor: PropTypes.string,
	}),
	children: PropTypes.node,
};

// Produces a lighter color based on a hex color and a percent
// lightenColor("#067647", 20) will produce a color 20% lighter than #067647
const lightenColor = (color, percent) => {
	let r = parseInt(color.substring(1, 3), 16);
	let g = parseInt(color.substring(3, 5), 16);
	let b = parseInt(color.substring(5, 7), 16);

	const amt = Math.round((255 * percent) / 100);

	r = r + amt <= 255 ? r + amt : 255;
	g = g + amt <= 255 ? g + amt : 255;
	b = b + amt <= 255 ? b + amt : 255;

	r = r.toString(16).padStart(2, "0");
	g = g.toString(16).padStart(2, "0");
	b = b.toString(16).padStart(2, "0");

	return `#${r}${g}${b}`;
};

/**
 * @component
 * @param {Object} props
 * @param {string} props.label - The label of the label
 * @param {string} props.color - The color of the label, specified in #RRGGBB format
 * @returns {JSX.Element}
 * @example
 * // Render a red label
 * <ColoredLabel label="Label" color="#FF0000" />
 */

const ColoredLabel = ({ label, color }) => {
	const theme = useTheme();
	// If an invalid color is passed, default to the labelGray color
	if (typeof color !== "string" || !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
		color = theme.palette.primary.lowContrast;
	}

	// Calculate lighter shades for border and bg
	const borderColor = lightenColor(color, 20);
	const bgColor = lightenColor(color, 75);

	return (
		<BaseLabel
			label={label}
			styles={{
				color: color,
				borderColor: borderColor,
				backgroundColor: bgColor,
			}}
		></BaseLabel>
	);
};

ColoredLabel.propTypes = {
	label: PropTypes.string.isRequired,
	color: PropTypes.string.isRequired,
};

/**
 * @component
 * @param {Object} props
 * @param {'up' | 'down' | 'paused' | 'pending' | 'cannot resolve' | 'published' | 'unpublished'} props.status - The status for the label
 * @param {string} props.text - The text of the label
 * @returns {JSX.Element}
 * @example
 * // Render an active label
 * <StatusLabel status="up" text="Active" />
 */

const statusToTheme = {
	up: "success",
	down: "error",
	paused: "warning",
	pending: "warning",
	"cannot resolve": "error",
	published: "success",
	unpublished: "error",
};

const StatusLabel = ({ status, text, customStyles }) => {
	const theme = useTheme();

	const themeColor = statusToTheme[status];

	return (
		<BaseLabel
			label={text}
			styles={{
				color: theme.palette[themeColor].main,
				borderColor: theme.palette[themeColor].lowContrast,
				...customStyles,
			}}
		>
			<Box
				width={7}
				height={7}
				bgcolor={theme.palette[themeColor].lowContrast}
				borderRadius="50%"
				marginRight="5px"
			/>
		</BaseLabel>
	);
};

StatusLabel.propTypes = {
	status: PropTypes.oneOf(["up", "down", "paused", "pending", "cannot resolve", "published", "unpublished"]),
	text: PropTypes.string,
	customStyles: PropTypes.object,
};

export { BaseLabel, ColoredLabel, StatusLabel };
