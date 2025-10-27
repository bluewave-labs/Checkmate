import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
export const PulseDot = ({ color }: { color: string }) => {
	const theme = useTheme();
	return (
		<Stack
			width="26px"
			height="24px"
			alignItems="center"
			justifyContent="center"
		>
			<Box
				minWidth="18px"
				minHeight="18px"
				sx={{
					position: "relative",
					backgroundColor: color,
					borderRadius: "50%",
					"&::before": {
						content: `""`,
						position: "absolute",
						width: "100%",
						height: "100%",
						backgroundColor: "inherit",
						borderRadius: "50%",
						animation: "ripple 1.8s ease-out infinite",
					},
					"&::after": {
						content: `""`,
						position: "absolute",
						width: "7px",
						height: "7px",
						borderRadius: "50%",
						backgroundColor: theme.palette.accent.contrastText,
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
					},
				}}
			/>
		</Stack>
	);
};
