import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { TriangleAlert } from "lucide-react";
import type { RootState } from "@/Types/state";
import type { EgressState } from "@/Types/Egress";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import { LAYOUT } from "@/Utils/Theme/constants";

interface EgressBannerProps {
	state: EgressState | null;
}

export const EgressBanner = ({ state }: EgressBannerProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const uiTimezone = useSelector((s: RootState) => s.ui.timezone);

	if (state?.status !== "degraded") return null;

	const message = state.degradedSince
		? t("components.egressBanner.degraded", {
				time: formatDateWithTz(state.degradedSince, "ddd, MMM D, HH:mm", uiTimezone),
			})
		: t("components.egressBanner.degradedNoTime");

	return (
		<Box
			position="fixed"
			top={0}
			left={0}
			right={0}
			zIndex={theme.zIndex.snackbar}
			bgcolor={theme.palette.warning.main}
			color={theme.palette.warning.contrastText}
			px={theme.spacing(LAYOUT.MD)}
			py={theme.spacing(LAYOUT.XS)}
			role="status"
		>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="center"
				gap={theme.spacing(LAYOUT.XS)}
			>
				<TriangleAlert size={20} />
				<Typography
					variant="body2"
					fontWeight={500}
				>
					{message}
				</Typography>
			</Stack>
		</Box>
	);
};
