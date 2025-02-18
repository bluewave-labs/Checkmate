import { Box, styled } from "@mui/material";
import PropTypes from "prop-types";

/**
 * IconBox - A styled box component for rendering icons with consistent sizing and styling
 *
 * @component
 * @param {Object} [props] - Configuration options for the IconBox
 * @param {number} [props.height=34] - Height of the icon box
 * @param {number} [props.width=34] - Width of the icon box
 * @param {number} [props.minWidth=34] - Minimum width of the icon box
 * @param {number} [props.borderRadius=4] - Border radius of the icon box
 * @param {number} [props.svgWidth=20] - Width of the SVG icon
 * @param {number} [props.svgHeight=20] - Height of the SVG icon
 *
 * @example
 * // Basic usage
 * <IconBox>
 *   <SomeIcon />
 * </IconBox>
 *
 * @example
 * // Customized usage
 * <IconBox
 *   height={40}
 *   width={40}
 *   svgWidth={24}
 *   svgHeight={24}
 * >
 *   <CustomIcon />
 * </IconBox>
 *
 * @returns {React.ReactElement} A styled box containing an icon
 */
const IconBox = styled(Box)(
	({
		theme,
		height = 34,
		width = 34,
		minWidth = 34,
		borderRadius = 4,
		svgWidth = 20,
		svgHeight = 20,
	}) => ({
		height: height,
		minWidth: minWidth,
		width: width,
		position: "relative",
		border: 1,
		borderStyle: "solid",
		borderColor: theme.palette.primary.lowContrast,
		borderRadius: borderRadius,
		backgroundColor: theme.palette.tertiary.main,
		"& svg": {
			position: "absolute",
			top: "50%",
			left: "50%",
			transform: "translate(-50%, -50%)",
			width: svgWidth,
			height: svgHeight,
			"& path": {
				stroke: theme.palette.primary.contrastTextTertiary,
			},
		},
	})
);

IconBox.propTypes = {
	height: PropTypes.number,
	width: PropTypes.number,
	minWidth: PropTypes.number,
	borderRadius: PropTypes.number,
	svgWidth: PropTypes.number,
	svgHeight: PropTypes.number,
};

export default IconBox;
