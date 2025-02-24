import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { Box, Stack, Typography } from "@mui/material";
import { RowContainer } from "../StandardContainer";

/**

 *
 * @component
 * @example
 *
 * @param {string} props.headerText - Header text
 * @param {number} props.headerLevel - Font characteristic of the header
 * @param {string} props.subHeaderText - Subheader text
 * @param {number} props.subHeaderLevel - Font characteristic of the subheader
 * @param {string} props.alignItems - Align items
 * @param {node} props.children - Children
 * @returns {JSX.Element} The rendered component
 */

const SubHeader = ({
	headerText,
	headerLevel = 1,
	subHeaderText,
	subHeaderLevel = 1,
	alignItems = "center",
	children,
}) => {
	const theme = useTheme();
	return (
		<Stack
			direction="row"
			alignItems={alignItems}
			justifyContent="space-between"
		>
			<Stack direction={"column"}>
				<Typography
					component={`h${headerLevel}`}
					variant={`h${headerLevel}`}
					mb={theme.spacing(1)}
				>
					<Typography
						component="span"
						fontSize="inherit"
						color={theme.palette.primary.contrastTextTertiary}
					>
						{headerText}
					</Typography>
				</Typography>
				<Typography
					variant={`body${subHeaderLevel}`}
					color={theme.palette.primary.contrastTextTertiary}
				>
					{subHeaderText}
				</Typography>
			</Stack>
			{children}
		</Stack>
	);
};

SubHeader.propTypes = {
	headerText: PropTypes.string,
	headerLevel: PropTypes.number,
	subHeaderText: PropTypes.string,
	subHeaderLevel: PropTypes.number,
	alignItems: PropTypes.string,
	children: PropTypes.node,
};

export default SubHeader;
