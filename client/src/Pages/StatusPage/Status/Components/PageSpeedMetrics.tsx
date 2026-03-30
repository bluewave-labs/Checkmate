import Typography from "@mui/material/Typography";
import { Gauge } from "@/Components/design-elements";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { Monitor } from "@/Types/Monitor";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";
import { getPageSpeedGaugeColor } from "@/Utils/MonitorUtils";

const GAUGE_RADIUS = 60;
const GAUGE_STROKE_WIDTH = 12;

interface StatusPageMonitor extends Monitor {
	checks?: Monitor["recentChecks"];
}

interface MetricConfig {
	key: string;
	label: string;
	progress: number;
}

const MetricItem = ({ label, progress }: MetricConfig) => {
	const theme = useTheme();
	return (
		<Grid
			size={{ xs: 12, md: 3 }}
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				textAlign: "center",
				gap: theme.spacing(SPACING.LG),
				padding: theme.spacing(LAYOUT.XS),
				borderRight: { xs: "none", md: `1px solid ${theme.palette.divider}` },
				borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: "none" },
				"&:last-child": {
					borderRight: "none",
					borderBottom: "none",
					paddingBottom: theme.spacing(SPACING.LG),
				},
			}}
		>
			<Box
				display="flex"
				flexDirection="column"
				alignItems="center"
			>
				<Gauge
					progress={progress}
					radius={GAUGE_RADIUS}
					strokeWidth={GAUGE_STROKE_WIDTH}
					colorFn={getPageSpeedGaugeColor}
				/>
				<Typography variant="body2">{label}</Typography>
			</Box>
		</Grid>
	);
};

const buildMetrics = (
	check: NonNullable<Monitor["recentChecks"]>[number],
	t: (key: string) => string
): MetricConfig[] => [
	{
		key: "performance",
		label: t("pages.statusPages.monitorsList.pagespeed.performance"),
		progress: check.performance ?? 0,
	},
	{
		key: "accessibility",
		label: t("pages.statusPages.monitorsList.pagespeed.accessibility"),
		progress: check.accessibility ?? 0,
	},
	{
		key: "bestPractices",
		label: t("pages.statusPages.monitorsList.pagespeed.bestPractices"),
		progress: check.bestPractices ?? 0,
	},
	{
		key: "seo",
		label: t("pages.statusPages.monitorsList.pagespeed.seo"),
		progress: check.seo ?? 0,
	},
];

export const PageSpeedMetrics = ({ monitor }: { monitor: StatusPageMonitor }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const latestCheck = monitor.recentChecks?.[0] ?? monitor.checks?.[0];

	if (!latestCheck) {
		return (
			<Typography
				variant="body2"
				color={theme.palette.text.secondary}
			>
				{t("pages.statusPages.monitorsList.noData")}
			</Typography>
		);
	}

	const metrics = buildMetrics(latestCheck, t);

	return (
		<Grid
			container
			alignItems="center"
			padding={theme.spacing(LAYOUT.LG)}
			flex={1}
		>
			{metrics.map((metric) => (
				<MetricItem
					key={metric.key}
					label={metric.label}
					progress={metric.progress}
				/>
			))}
		</Grid>
	);
};
