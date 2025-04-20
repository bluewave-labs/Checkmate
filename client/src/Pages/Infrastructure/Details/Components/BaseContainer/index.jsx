/**
 * Renders a base box with consistent styling
 * @param {Object} props - Component properties
 * @param {React.ReactNode} props.children - Child components to render inside the box
 * @param {Object} props.sx - Additional styling for the box
 * @returns {React.ReactElement} Styled box component
 */

// Components
import { Box } from "@mui/material";

// Utils
import { useTheme } from "@emotion/react";
import { useHardwareUtils } from "../../Hooks/useHardwareUtils";
import PropTypes from "prop-types";

const BaseContainer = ({ children, sx = {} }) => {
	const theme = useTheme();
	const { getDimensions } = useHardwareUtils();
	return (
		<Box
			sx={{
				padding: `${theme.spacing(getDimensions().baseBoxPaddingVertical)} ${theme.spacing(getDimensions().baseBoxPaddingHorizontal)}`,
				minWidth: 200,
				width: 225,
				backgroundColor: theme.palette.primary.main,
				border: 1,
				borderStyle: "solid",
				borderColor: theme.palette.primary.lowContrast,
				...sx,
			}}
		>
			{children}
		</Box>
	);
};

BaseContainer.propTypes = {
	children: PropTypes.node.isRequired,
	sx: PropTypes.object,
};

export default BaseContainer;
