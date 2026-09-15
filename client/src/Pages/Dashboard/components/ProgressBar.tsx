import { LAYOUT } from "@/Utils/Theme/constants";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

interface ProgressBarProps {
	fillRatio: number;
}

export const ProgressBar = ({ fillRatio }: ProgressBarProps) => {
	const theme = useTheme();
	const clamped = Math.min(1, Math.max(0, fillRatio));

	return (
		<Box
			height={theme.spacing(LAYOUT.XS)}
			borderRadius={theme.shape.borderRadius}
			bgcolor={theme.palette.action.disabledBackground}
			overflow="hidden"
		>
			<Box
				height="100%"
				width={`${clamped * 100}%`}
				borderRadius={theme.shape.borderRadius}
				bgcolor={theme.palette.primary.main}
			/>
		</Box>
	);
};
