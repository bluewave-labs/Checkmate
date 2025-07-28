import { useTheme } from "@emotion/react";
import Box from "@mui/material/Box";
import Background from "../../assets/Images/background-grid.svg?react";
import SkeletonDark from "../../assets/Images/create-placeholder-dark.svg?react";
import OutputAnimation from "../../assets/Animations/output.gif";
import { useSelector } from "react-redux";
const FallbackBackground = () => {
	const theme = useTheme();
	const mode = useSelector((state) => state.ui.mode);
	return (
		<>
			{mode === "light" ? (
				<Box
					component="img"
					src={OutputAnimation}
					Background="transparent"
					alt="Loading animation"
					sx={{
						zIndex: 1,
						border: "none",
						borderRadius: theme.spacing(8),
						width: "100%",
					}}
				/>
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
		</>
	);
};

export default FallbackBackground;
