import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useTheme, keyframes } from "@mui/material";

const ripple = keyframes`
	from {
		opacity: 1;
		transform: scale(0);
	}
	to {
		opacity: 0;
		transform: scale(2);
	}
`;

interface PulseDotProps {
	color: string;
}

export const PulseDot = ({ color }: PulseDotProps) => {
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
						animation: `${ripple} 1.8s ease-out infinite`,
					},
					"&::after": {
						content: `""`,
						position: "absolute",
						width: "7px",
						height: "7px",
						borderRadius: "50%",
						backgroundColor: theme.palette.background.paper,
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
					},
				}}
			/>
		</Stack>
	);
};
