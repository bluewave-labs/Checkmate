import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { Stack, Typography } from "@mui/material";

/**

 *
 * @component
 * @example
 *
 * @param {string} props.direction - Direction of the subheader
 * @param {string} props.headerText - Header text
 * @param {number} props.headerLevel - Font characteristic of the header
 * @param {string} props.subHeaderText - Subheader text
 * @param {number} props.subHeaderLevel - Font characteristic of the subheader
 * @param {string} props.alignItems - Align items
 * @param {node} props.children - Children
 * @returns {JSX.Element} The rendered component
 */

const SubHeader = ({
	direction = "row",
	headerText,
	headerLevel = 1,
	subHeaderText,
	subHeaderLevel = 1,
	alignItems = "center",
	children,
	...props
}) => {
	const theme = useTheme();
	return (
		<Stack
			direction={direction}
			alignItems={alignItems}
			justifyContent="space-between"
			{...props}
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
	direction: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
	headerText: PropTypes.string,
	headerLevel: PropTypes.number,
	subHeaderText: PropTypes.string,
	subHeaderLevel: PropTypes.number,
	alignItems: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
	children: PropTypes.node,
};

export default SubHeader;
