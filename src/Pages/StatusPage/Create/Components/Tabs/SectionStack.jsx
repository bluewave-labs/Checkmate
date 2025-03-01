import { Stack, Typography } from "@mui/material";
import ConfigBox from "../../../../../Components/ConfigBox";
import PropTypes from "prop-types";

// This can be used to add any extra/additional section/stacks on top of existing sections on the tab
const SectionStack = ({ title, description, children }) => (
	<ConfigBox>
		<Stack gap={2}>
			<Typography component="h2">{title}</Typography>
			<Typography component="p">{description}</Typography>
		</Stack>
		{children}
	</ConfigBox>
);

SectionStack.propTypes = {
	title: PropTypes.string.isRequired, // Title must be a string and is required
	description: PropTypes.string.isRequired, // Description must be a string and is required
	children: PropTypes.node.isRequired,
};

export default SectionStack;
