import { Box, Stack, Typography } from "@mui/material";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import ConfigBox from "../ConfigBox";

/**
 * ConfigRow is a styled container used to layout content in a row format with specific padding, border, and spacing.
 * It serves as the wrapper for ConfigBox, with the left section displaying the title and description,
 * and the right section displaying the children.
 *
 * @component
 * @example
 * return (
 *   <ConfigBox>
 *     <div>Left content (Title + Description)</div>
 *     <div>Right content (Children)</div>
 *   </ConfigBox>
 * );
 */

const ConfigRow = ({ title, description, children }) => {
	const theme = useTheme();

	return (
		<ConfigBox>
			<Box>
				<Typography
					component="h2"
					variant="h2"
				>
					{title}
				</Typography>
				{description && (
					<Typography
						variant="body2"
						mt={theme.spacing(2)}
					>
						{description}
					</Typography>
				)}
			</Box>
			<Stack
				gap={theme.spacing(15)}
				mt={theme.spacing(4)}
			>
				{children}
			</Stack>
		</ConfigBox>
	);
};

ConfigRow.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.string,
	children: PropTypes.node,
};

export default ConfigRow;
