import Background from "../../../assets/Images/background-grid.svg?react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AuthHeader from "../components/AuthHeader";
import { useTheme } from "@mui/material/styles";
import Logo from "../../../assets/icons/checkmate-icon.svg?react";
import PropTypes from "prop-types";

const AuthPageWrapper = ({ children, heading, welcome }) => {
	const theme = useTheme();
	return (
		<Stack
			gap={theme.spacing(10)}
			minHeight="100vh"
			position="relative"
			backgroundColor={theme.palette.primary.main}
			sx={{ overflow: "hidden" }}
		>
			<AuthHeader hideLogo={true} />
			<Box
				sx={{
					position: "absolute",
					top: 0,
					left: "0%",
					transform: "translate(-40%, -40%)",
					zIndex: 0,
					width: "100%",
					height: "100%",
					"& svg g g:last-of-type path": {
						stroke: theme.palette.primary.lowContrast,
					},
				}}
			>
				<Background style={{ width: "100%" }} />
			</Box>
			<Box
				sx={{
					position: "absolute",
					bottom: 0,
					right: 0,
					transform: "translate(45%, 55%)",
					zIndex: 0,
					width: "100%",
					height: "100%",
					"& svg g g:last-of-type path": {
						stroke: theme.palette.primary.lowContrast,
					},
				}}
			>
				<Background style={{ width: "100%" }} />
			</Box>
			<Stack
				backgroundColor={theme.palette.primary.main}
				sx={{
					borderRadius: theme.spacing(8),
					boxShadow: theme.palette.tertiary.cardShadow,
					margin: "auto",
					alignItems: "center",
					gap: theme.spacing(10),
					padding: theme.spacing(20),
					zIndex: 1,
					position: "relative",
					width: {
						sm: "60%",
						md: "50%",
						lg: "40%",
						xl: "30%",
					},
				}}
			>
				<Box
					mb={theme.spacing(10)}
					mt={theme.spacing(5)}
				>
					<Box
						sx={{
							width: { xs: 60, sm: 70, md: 80 },
						}}
					/>
					<Logo style={{ width: "100%", height: "100%" }} />
				</Box>
				<Stack
					mb={theme.spacing(4)}
					textAlign="center"
				>
					<Typography
						variant="h1"
						mb={theme.spacing(2)}
					>
						{welcome}
					</Typography>
					<Typography variant="h1">{heading}</Typography>
				</Stack>
				{children}
			</Stack>
		</Stack>
	);
};

export default AuthPageWrapper;

AuthPageWrapper.propTypes = {
	children: PropTypes.node,
	heading: PropTypes.node,
	welcome: PropTypes.node,
};
