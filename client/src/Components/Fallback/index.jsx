import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { Box, Stack } from "@mui/material";
import "./index.css";
import FallbackTitle from "./FallbackTitle";
import FallbackCheckList from "./FallbackCheckList";
import FallbackActionButtons from "./FallBackActionButtons";
import FallbackBackground from "./FallbackBackground";
import FallbackContainer from "./FallbackContainer";
/**
 * Fallback component to display a fallback UI with a title, a list of checks, and a navigation button.
 *
 * @param {Object} props - The component props.
 * @param {string} props.title - The title to be displayed in the fallback UI.
 * @param {string} props.type - The type of the fallback (e.g., "pageSpeed", "notifications").
 * @param {Array<string>} props.checks - An array of strings representing the checks to display.
 * @param {string} [props.link="/"] - The link to navigate to.
 * @param {boolean} [props.showPageSpeedWarning=false] - Whether to show the PageSpeed API warning.
 * @returns {JSX.Element} The rendered fallback UI.
 */

const Fallback = ({ title, checks, link = "/", isAdmin, type, children }) => {
	const theme = useTheme();
	return (
		<Box
			position="relative"
			sx={{
				height: "100%",
				width: "100%",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<FallbackContainer type={type}>
				<FallbackBackground />
				<Stack
					gap={theme.spacing(5)}
					zIndex={1}
					alignItems="center"
				>
					<FallbackTitle title={title} />
					<FallbackCheckList
						checks={checks}
						title={title}
						type={type}
					/>
				</Stack>
				{isAdmin && (
					<Stack
						gap={theme.spacing(10)}
						alignItems="center"
					>
						<FallbackActionButtons
							title={title}
							link={link}
							type={type}
						/>
						{children}
					</Stack>
				)}
			</FallbackContainer>
		</Box>
	);
};
Fallback.propTypes = {
	title: PropTypes.string.isRequired,
	checks: PropTypes.arrayOf(PropTypes.string).isRequired,
	link: PropTypes.string,
	isAdmin: PropTypes.bool,
	showPageSpeedWarning: PropTypes.bool,
	type: PropTypes.string.isRequired,
	children: PropTypes.node,
};
export default Fallback;
