import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { SPACING } from "@/Utils/Theme/constants";
import { ProgressBar } from "@/Pages/Dashboard/components/ProgressBar";

interface BarRowProps {
	label: string;
	value: string;
	fillRatio: number;
	valueColor?: string;
}

export const BarRow = ({ label, value, fillRatio, valueColor }: BarRowProps) => {
	const theme = useTheme();

	return (
		<Stack gap={theme.spacing(SPACING.LG)}>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
			>
				<Typography
					fontSize={typographyLevels.m}
					color={theme.palette.text.primary}
				>
					{label}
				</Typography>
				<Typography
					fontSize={typographyLevels.m}
					color={valueColor ?? theme.palette.primary.main}
					fontWeight={500}
				>
					{value}
				</Typography>
			</Stack>
			<ProgressBar fillRatio={fillRatio} />
		</Stack>
	);
};
