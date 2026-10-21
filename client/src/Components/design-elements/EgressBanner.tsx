import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";
import type { EgressSummary } from "@/Types/Egress";
import { useFormatDate } from "@/Hooks/useFormatDate";
import { LAYOUT } from "@/Utils/Theme/constants";

interface EgressBannerProps {
	state: EgressSummary | null;
}

export const EgressBanner = ({ state }: EgressBannerProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const formatDate = useFormatDate();

	// Built from live worker verdicts, so there is no stored state to go stale; hidden whenever the check is off.
	if (!state?.enabled || state.status !== "degraded") return null;

	const time = state.degradedSince ? formatDate(state.degradedSince, "dateTime") : null;
	let message: string;
	if (state.totalWorkers <= 1) {
		message = time
			? t("components.egressBanner.degraded", { time })
			: t("components.egressBanner.degradedNoTime");
	} else {
		const counts = { degraded: state.degradedWorkers, total: state.totalWorkers };
		message = time
			? t("components.egressBanner.degradedWorkers", { ...counts, time })
			: t("components.egressBanner.degradedWorkersNoTime", counts);
	}

	// Rendered in flow rather than fixed like OfflineBanner: a degraded spell can last hours, and a fixed
	// strip would sit over the sidebar and page header for all of it.
	return (
		<Box
			width="100%"
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
