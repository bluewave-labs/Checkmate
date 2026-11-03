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

// Original design proportions: 7px hole, 26×24 box.
const BASE_SIZE = 18;
const HOLE_RATIO = 7 / BASE_SIZE;
const BOX_PAD_X = 26 - BASE_SIZE;
const BOX_PAD_Y = 24 - BASE_SIZE;

interface PulseDotProps {
	color: string;
	size?: number;
}

export const PulseDot = ({ color, size = BASE_SIZE }: PulseDotProps) => {
	const theme = useTheme();
	const holeSize = Math.round(size * HOLE_RATIO);

	return (
		<Stack
			width={`${size + BOX_PAD_X}px`}
			height={`${size + BOX_PAD_Y}px`}
			alignItems="center"
			justifyContent="center"
		>
			<Box
				minWidth={`${size}px`}
				minHeight={`${size}px`}
				bgcolor={color}
				borderRadius={"50%"}
				sx={{
					position: "relative",
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
						width: `${holeSize}px`,
						height: `${holeSize}px`,
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
