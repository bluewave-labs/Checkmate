import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { Box, Stack, Typography } from "@mui/material";
import { RowContainer } from "../../../../../Components/StandardContainer";

/**

 *
 * @component
 * @example
 *
 * @param {Object} props
 * @param {string} props.type - The type of monitor to be displayed in the message
 * @returns {JSX.Element} The rendered component
 */

const SubHeader = ({ headerText='', subHeaderText='', rightCatagoryTitle='',rightDescription=''  }) => {
	const theme = useTheme();
	
	return (
		<Stack 
			direction="row" 
			justifyContent="space-between"
			>
			<Stack 
				direction={"column"}
			>
				<Typography
					component="h1"
					variant="h1"
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
					variant="body2"
					lineHeight={1}
					color={theme.palette.primary.contrastTextTertiary}
				>
					{subHeaderText}
				</Typography>
			</Stack>
			
			{rightCatagoryTitle &&
			<RowContainer sx={{ width: "20%" }}>
				<Stack>
					<Typography variant={`body2`}>{rightCatagoryTitle}</Typography>
					<Typography variant={`h2`}>
						{rightDescription}
					</Typography>
				</Stack>
			</RowContainer>
			}



		</Stack>
	);
};

SubHeader.propTypes = {
	type: PropTypes.string,
};

export default SubHeader;
