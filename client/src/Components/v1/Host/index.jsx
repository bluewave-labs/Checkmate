import { Stack, Typography } from "@mui/material";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import Dot from "../Dot/index.jsx";
import { StatusLabel } from "@/Components/v1/Label/index.jsx";
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
const Host = ({ url, title, percentageColor, percentage, showURL, status }) => {
	const theme = useTheme();
	return (
		<Stack>
			<Stack
				direction="row"
				position="relative"
				alignItems="center"
				gap={theme.spacing(5)}
			>
				<Typography
					variant="h6"
					sx={{
						fontWeight: 600,
						fontSize: "1.1rem",
					}}
				>
					{title}
				</Typography>

				{percentageColor && percentage && (
					<>
						<Dot />
						<Typography
							variant="h6"
							sx={{
								fontWeight: 600,
								fontSize: "1.1rem",
								color: percentageColor,
							}}
						>
							{percentage}%
						</Typography>
						<StatusLabel
							status={status}
							text={status}
							customStyles={{ textTransform: "capitalize" }}
						/>
					</>
				)}
			</Stack>
			{showURL && <span style={{ opacity: 0.6 }}>{url}</span>}
		</Stack>
	);
};

Host.propTypes = {
	title: PropTypes.string,
	percentageColor: PropTypes.string,
	percentage: PropTypes.string,
	url: PropTypes.string,
	showURL: PropTypes.bool,
	status: PropTypes.string,
};

export default Host;
