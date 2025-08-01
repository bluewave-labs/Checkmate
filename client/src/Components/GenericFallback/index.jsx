import { useTheme } from "@emotion/react";
import { Box, Stack } from "@mui/material";
import OutputAnimation from "../../assets/Animations/output.gif";
import DarkmodeOutput from "../../assets/Animations/darkmodeOutput.gif";
import Background from "../../assets/Images/background-grid.svg?react";
import { useSelector } from "react-redux";

/**
 * Fallback component to display a fallback UI for network errors
 *
 * @returns {JSX.Element} The rendered fallback UI.
 */

const GenericFallback = ({ children }) => {
	const theme = useTheme();
	const mode = useSelector((state) => state.ui.mode);

	return (
		<Box
			padding={theme.spacing(16)}
			position="relative"
			border={1}
			borderColor={theme.palette.primary.lowContrast}
			borderRadius={theme.shape.borderRadius}
			backgroundColor={theme.palette.primary.main}
			overflow="hidden"
			sx={{
				borderStyle: "dashed",
			}}
		>
			<Stack
				alignItems="center"
				gap={theme.spacing(20)}
				sx={{
					width: "fit-content",
					margin: "auto",
					marginTop: "100px",
				}}
			>
				<Box
					component="img"
					src={mode === "light" ? OutputAnimation : DarkmodeOutput}
					Background="transparent"
					alt="Loading animation"
					sx={{
						zIndex: 1,
						border: "none",
						borderRadius: theme.spacing(8),
						width: "100%",
					}}
				/>
				<Box
					sx={{
						"& svg g g:last-of-type path": {
							stroke: theme.palette.primary.lowContrast,
						},
						position: "absolute",
						top: "0",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: "100%",
						maxWidth: "800px",
						height: "100%",
						maxHeight: "800px",
						backgroundPosition: "center",
						backgroundSize: "cover",
						backgroundRepeat: "no-repeat",
					}}
				>
					<Background style={{ width: "100%" }} />
				</Box>
				<Stack
					gap={theme.spacing(4)}
					alignItems="center"
					maxWidth={"300px"}
					zIndex={1}
				>
					{children}
				</Stack>
			</Stack>
		</Box>
	);
};

export default GenericFallback;
