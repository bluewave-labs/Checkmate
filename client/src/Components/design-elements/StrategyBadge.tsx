import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { PageSpeedStrategy } from "@/Types/Monitor";
import { SPACING } from "@/Utils/Theme/constants";

interface StrategyBadgeProps {
	strategy: PageSpeedStrategy | undefined;
	variant?: "caption" | "body2";
}

export const StrategyBadge = ({ strategy, variant = "body2" }: StrategyBadgeProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	if (!strategy) {
		return null;
	}

	return (
		<Typography
			variant={variant}
			px={SPACING.XXL}
			py={SPACING.SM}
			borderRadius={theme.shape.borderRadius}
			bgcolor={theme.palette.secondary.light}
			color={theme.palette.text.primary}
		>
			{t(`pages.pageSpeed.strategy.${strategy}`)}
		</Typography>
	);
};
