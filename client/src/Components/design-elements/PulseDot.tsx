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
	/** Diameter of the solid dot. The ripple and the inner hole scale with it. */
	size?: number;
}

export const PulseDot = ({ color, size = 18 }: PulseDotProps) => {
	const theme = useTheme();

	return (
		<Stack
			width={`${size + 8}px`}
			height={`${size + 6}px`}
			alignItems="center"
			justifyContent="center"
		>
			<Box
				minWidth={`${size}px`}
				minHeight={`${size}px`}
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
						width: `${Math.round(size * 0.39)}px`,
						height: `${Math.round(size * 0.39)}px`,
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
