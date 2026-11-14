import { LAYOUT, RADIUS } from "@/Utils/Theme/constants";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

interface ProgressBarProps {
	fillRatio: number;
	fillColor?: string;
}

export const ProgressBar = ({ fillRatio, fillColor }: ProgressBarProps) => {
	const theme = useTheme();
	const clamped = Math.min(1, Math.max(0, fillRatio));

	return (
		<Box
			height={theme.spacing(LAYOUT.XS)}
			borderRadius={RADIUS.SM}
			bgcolor={theme.palette.neutral.hairline}
			overflow="hidden"
		>
			<Box
				height="100%"
				width={`${clamped * 100}%`}
				borderRadius={RADIUS.SM}
				bgcolor={fillColor ?? theme.palette.primary.main}
			/>
		</Box>
	);
};
