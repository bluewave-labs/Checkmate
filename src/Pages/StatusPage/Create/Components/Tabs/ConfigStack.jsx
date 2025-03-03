import { Stack, Typography } from "@mui/material";
import ConfigBox from "../../../../../Components/ConfigBox";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";

// This can be used to add any extra/additional section/stacks on top of existing sections on the tab
const ConfigStack = ({ title, description, children }) => {
	const theme = useTheme();
	return (
		<ConfigBox>
			<Stack gap={theme.spacing(6)}>
				<Typography component="h2">{title}</Typography>
				<Typography component="p">{description}</Typography>
			</Stack>
			{children}
		</ConfigBox>
	);
};

ConfigStack.propTypes = {
	title: PropTypes.string.isRequired, // Title must be a string and is required
	description: PropTypes.string.isRequired, // Description must be a string and is required
	children: PropTypes.node.isRequired,
};

export default ConfigStack;
