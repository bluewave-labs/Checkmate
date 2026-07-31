import type { CheckSnapshot } from "@/Types/Check";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import prettyMilliseconds from "pretty-ms";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import { useStatusPageTheme } from "@/Pages/StatusPage/Status/themes/StatusPageThemeProvider";

export const ThemedChartTooltip = ({ check }: { check: CheckSnapshot }) => {
	const { timezone } = useStatusPageTheme();
	return (
		<Stack gap={0.25}>
			<Typography
				variant="caption"
				fontWeight={600}
			>
				{check.status
					? `${prettyMilliseconds(check.responseTime, { compact: true })}`
					: t("pages.statusPages.monitorsList.chart.downTooltip")}
			</Typography>
			<Typography
				variant="caption"
				sx={{ opacity: 0.8 }}
			>
				{formatDateWithTz(check.createdAt, "ddd, MMMM D, YYYY, HH:mm A", timezone)}
			</Typography>
		</Stack>
	);
};
