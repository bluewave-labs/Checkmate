import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { Box, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { setGreeting } from "../Features/UI/uiSlice";



/**

 *
 * @component
 * @example
 *
 * @param {Object} props
 * @param {string} props.type - The type of monitor to be displayed in the message
 * @returns {JSX.Element} The rendered component
 */

const Greeting = ({ type = "" }) => {
	const theme = useTheme();
	const dispatch = useDispatch();

	return (
		<Box>
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
					Real-time, real-device coverage
				</Typography>
			</Typography>
			<Typography
				variant="h2"
				lineHeight={1}
				color={theme.palette.primary.contrastTextTertiary}
			>
				Powered by millions of devices worldwide, view a system's performance by global region, country or city.
			</Typography>
		</Box>
	);
};

Greeting.propTypes = {
	type: PropTypes.string,
};

export default Greeting;
