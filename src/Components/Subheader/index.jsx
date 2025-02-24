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
 * @param {string} props.rightCatagoryTitle - Message for right section
 * @param {number} props.rightCatagoryTitleLevel - Font characteristic of the right section header
 * @param {string} props.rightDescription - Description for right section
 * @param {number} props.rightDescriptionLevel - Font characteristic of the right section description
 * @returns {JSX.Element} The rendered component
 */

const SubHeader = ({
	headerText,
	headerLevel = 1,
	subHeaderText,
	subHeaderLevel = 1,
	rightCatagoryTitle,
	rightCatagoryTitleLevel = 2,
	rightDescription,
	rightDescriptionLevel = 2,
}) => {
	const theme = useTheme();

	return (
		<Stack
			direction="row"
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

			{rightCatagoryTitle && (
				<RowContainer sx={{ width: "20%" }}>
					<Stack>
						<Typography variant={`body${rightCatagoryTitleLevel}`}>
							{rightCatagoryTitle}
						</Typography>
						<Typography variant={`h${rightDescriptionLevel}`}>
							{rightDescription}
						</Typography>
					</Stack>
				</RowContainer>
			)}
		</Stack>
	);
};

SubHeader.propTypes = {
	headerText: PropTypes.string,
	headerLevel: PropTypes.number,
	subHeaderText: PropTypes.string,
	subHeaderLevel: PropTypes.number,
	rightCatagoryTitle: PropTypes.string,
	rightCatagoryTitleLevel: PropTypes.number,
	rightDescription: PropTypes.string,
	rightDescriptionLevel: PropTypes.number,
};

export default SubHeader;
