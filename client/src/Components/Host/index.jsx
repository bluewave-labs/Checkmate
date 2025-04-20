import { Stack, Typography } from "@mui/material";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import Dot from "../Dot";
/**
 * Host component.
 * This subcomponent receives a params object and displays the host details.
 *
 * @component
 * @param {Object} params - An object containing the following properties:
 * @param {string} params.url - The URL of the host.
 * @param {string} params.title - The name of the host.
 * @param {string} params.percentageColor - The color of the percentage text.
 * @param {number} params.percentage - The percentage to display.
 * @returns {React.ElementType} Returns a div element with the host details.
 */
const Host = ({ url, title, percentageColor, percentage }) => {
	const theme = useTheme();
	return (
		<Stack>
			<Stack
				direction="row"
				position="relative"
				alignItems="center"
				gap={theme.spacing(4)}
			>
				{title}
				{percentageColor && percentage && (
					<>
						<Dot />
						<Typography
							component="span"
							sx={{
								color: percentageColor,
								fontWeight: 500,
							}}
						>
							{percentage}%
						</Typography>
					</>
				)}
			</Stack>
			<span style={{ opacity: 0.6 }}>{url}</span>
		</Stack>
	);
};

Host.propTypes = {
	title: PropTypes.string,
	percentageColor: PropTypes.string,
	percentage: PropTypes.string,
	url: PropTypes.string,
};

export default Host;
