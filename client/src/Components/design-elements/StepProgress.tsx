import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { LAYOUT } from "@/Utils/Theme/constants";

interface StepProgressProps {
	steps: number;
	current: number;
}

export const StepProgress = ({ steps, current }: StepProgressProps) => {
	const theme = useTheme();
	const activeBg = `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`;
	const completedBg = `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.5)} 0%, ${alpha(theme.palette.primary.main, 0.5)} 100%)`;

	const getSegmentBackground = (index: number) => {
		if (index < current) return completedBg;
		if (index === current) return activeBg;
		return theme.palette.divider;
	};

	return (
		<Stack
			direction="row"
			gap={theme.spacing(LAYOUT.XS)}
			width="100%"
		>
			{Array.from({ length: steps }).map((_, index) => (
				<Box
					key={index}
					flex={1}
					height={theme.spacing(LAYOUT.XXS)}
					borderRadius={theme.shape.borderRadius}
					sx={{
						background: getSegmentBackground(index),
						transition: "background 0.2s ease",
					}}
				/>
			))}
		</Stack>
	);
};
