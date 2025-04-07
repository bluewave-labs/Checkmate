import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { Box, Button, Stack, Typography, Link } from "@mui/material";
import Skeleton from "../../assets/Images/create-placeholder.svg?react";
import SkeletonDark from "../../assets/Images/create-placeholder-dark.svg?react";
import Background from "../../assets/Images/background-grid.svg?react";
import Check from "../Check/Check";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Alert from "../Alert";
import "./index.css";

/**
 * Fallback component to display a fallback UI with a title, a list of checks, and a navigation button.
 *
 * @param {Object} props - The component props.
 * @param {string} props.title - The title to be displayed in the fallback UI.
 * @param {Array<string>} props.checks - An array of strings representing the checks to display.
 * @param {string} [props.link="/"] - The link to navigate to.
 * @param {boolean} [props.vowelStart=false] - Whether the title starts with a vowel.
 * @returns {JSX.Element} The rendered fallback UI.
 */

const Fallback = ({ title, checks, link = "/", isAdmin, vowelStart = false }) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const mode = useSelector((state) => state.ui.mode);

	// Custom warning message with clickable link
	const renderWarningMessage = () => {
		return (
			<>
				Warning: You haven't added a Google PageSpeed API key. Without it, the PageSpeed monitor won't function. {" "}
				<Link 
					href="https://docs.checkmate.so/users-guide/quickstart#env-vars-server"
					target="_blank"
					sx={{ 
						textDecoration: "underline",
						color: "inherit",
						fontWeight: "inherit",
						"&:hover": {
							textDecoration: "underline",
						}
					}}
				>
					Click here to learn
				</Link>
				{" "}how to add your API key.
			</>
		);
	};

	return (
		<Box
			position="relative"
			border={1}
			borderColor={theme.palette.primary.lowContrast}
			borderRadius={theme.shape.borderRadius}
			backgroundColor={theme.palette.primary.main}
			overflow="hidden"
			sx={{
				borderStyle: "dashed",
				minHeight: "calc(100vh - var(--env-var-spacing-2) * 2)",
			}}
		>
			<Stack
				className={`fallback__${title?.trim().split(" ")[0]}`}
				alignItems="center"
				gap={theme.spacing(20)}
			>
				{mode === "light" ? (
					<Skeleton style={{ zIndex: 1 }} />
				) : (
					<SkeletonDark style={{ zIndex: 1 }} />
				)}
				<Box
					className="background-pattern-svg"
					sx={{
						"& svg g g:last-of-type path": {
							stroke: theme.palette.primary.lowContrast,
						},
					}}
				>
					<Background style={{ width: "100%" }} />
				</Box>
				<Stack
					gap={theme.spacing(4)}
					maxWidth={"300px"}
					zIndex={1}
				>
					<Typography
						component="h1"
						marginY={theme.spacing(4)}
						color={theme.palette.primary.contrastTextTertiary}
					>
						{vowelStart ? "An" : "A"} {title} is used to:
					</Typography>
					{checks?.map((check, index) => (
						<Check
							text={check}
							key={`${title.trim().split(" ")[0]}-${index}`}
							outlined={true}
						/>
					))}
				</Stack>
				{/* TODO - display a different fallback if user is not an admin*/}
				{isAdmin && (
					<>
						<Button
							variant="contained"
							color="accent"
							sx={{ alignSelf: "center" }}
							onClick={() => navigate(link)}
						>
							Let's create your first {title}
						</Button>
						
						{/* Warning box for PageSpeed monitor */}
						{title === "pagespeed monitor" && (
							<Box sx={{ width: "80%", maxWidth: "600px", zIndex: 1 }}>
								<Box sx={{
									'& .alert.row-stack': {
										backgroundColor: theme.palette.warning.main,
										borderColor: theme.palette.warning.lowContrast,
										'& .MuiTypography-root': {
											color: theme.palette.warning.contrastText
										},
										'& .MuiBox-root > svg': {
											color: theme.palette.warning.contrastText
										}
									}
								}}>
									<Alert
										variant="warning"
										hasIcon={true}
										body={renderWarningMessage()}
									/>
								</Box>
							</Box>
						)}
					</>
				)}
			</Stack>
		</Box>
	);
};

Fallback.propTypes = {
	title: PropTypes.string.isRequired,
	checks: PropTypes.arrayOf(PropTypes.string).isRequired,
	link: PropTypes.string,
	isAdmin: PropTypes.bool,
	vowelStart: PropTypes.bool,
};

export default Fallback;
