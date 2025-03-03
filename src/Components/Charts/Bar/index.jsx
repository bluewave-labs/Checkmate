import { Box } from "@mui/material";
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";

/**
 * A customizable Bar component that renders a colored bar with optional children.
 *
 * @component
 *
 * @param {string} width The width of the bar (e.g., "100px").
 * @param {string} height The height of the bar (e.g., "50px").
 * @param {string} backgroundColor The background color of the bar (e.g., "#FF5733").
 * @param {string} [borderRadius] Optional border radius for the bar (e.g., "8px").
 * @param {node} children The content to be rendered inside the bar.
 *
 * @returns {JSX.Element} The Bar component.
 */

const Bar = ({ width, height, backgroundColor, borderRadius, children }) => {
	const theme = useTheme();

	return (
		<Box
			position="relative"
			width={width}
			height={height}
			backgroundColor={backgroundColor}
			sx={{
				borderRadius: borderRadius || theme.spacing(1.5),
				gap: "2px",
				display: "flex",
			}}
		>
			{children}
		</Box>
	);
};

Bar.propTypes = {
	width: PropTypes.string.isRequired,
	height: PropTypes.string.isRequired,
	backgroundColor: PropTypes.string.isRequired,
	borderRadius: PropTypes.string,
	children: PropTypes.node,
};

export default Bar;
