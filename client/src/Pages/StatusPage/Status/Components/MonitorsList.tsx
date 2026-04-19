import Stack from "@mui/material/Stack";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { HistogramResponseTime, HeatmapResponseTime } from "@/Components/common";
import { StatusLabel, BaseBox } from "@/Components/design-elements";
import { SwitchComponent } from "@/Components/inputs";
import { InfrastructureMetrics } from "@/Pages/StatusPage/Status/Components/InfrastructureMetrics";
import { PageSpeedMetrics } from "@/Pages/StatusPage/Status/Components/PageSpeedMetrics";

import { useTheme, type Theme } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { useState } from "react";
import type { Monitor } from "@/Types/Monitor";
import type { StatusPage } from "@/Types/StatusPage";
import { getMonitorTypeLabel } from "@/Types/StatusPage";
import type { RootState } from "@/Types/state";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";

interface StatusPageMonitor extends Monitor {
	checks?: Monitor["recentChecks"];
}

interface MonitorsListProps {
	statusPage: StatusPage;
	monitors: StatusPageMonitor[];
}

const getMonitorBadgeStyles = (monitorType: string, theme: Theme) => {
	const monitorColors: Record<string, string> = {
		hardware: theme.palette.info.light,
		pagespeed: theme.palette.warning.light,
	};

	const bg = monitorColors[monitorType] || theme.palette.success.light;
	return {
		backgroundColor: bg,
		color: theme.palette.background.paper,
		padding: `${theme.spacing(SPACING.SM)} ${theme.spacing(SPACING.LG)}`,
		borderRadius: theme.shape.borderRadius,
	};
};

const MonitorHeader = ({
	monitor,
	showURL,
}: {
	monitor: StatusPageMonitor;
	showURL: boolean;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="space-between"
			gap={theme.spacing(LAYOUT.XS)}
			mb={theme.spacing(LAYOUT.XS)}
		>
			<Box sx={{ overflow: "hidden", minWidth: 0, flex: 1 }}>
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(SPACING.LG)}
					mb={theme.spacing(SPACING.SM)}
				>
					<Typography
						variant="h6"
						sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
					>
						{monitor.name}
					</Typography>
					<Typography
						variant="caption"
						sx={getMonitorBadgeStyles(monitor.type ?? "", theme)}
					>
						{getMonitorTypeLabel(monitor.type, t)}
					</Typography>
				</Stack>
				{showURL && monitor.url && (
					<Typography
						variant="body2"
						color={theme.palette.text.secondary}
						sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
					>
						{monitor.url}
					</Typography>
				)}
			</Box>
			<StatusLabel status={monitor.status} />
		</Stack>
	);
};

const MonitorContent = ({
	monitor,
	statusPage,
	chartType,
}: {
	monitor: StatusPageMonitor;
	statusPage: StatusPage;
	chartType: string;
}) => {
	const theme = useTheme();

	if (monitor.type === "hardware") {
		if (statusPage.showInfrastructure === false) return null;
		return <InfrastructureMetrics monitor={monitor} />;
	}

	if (monitor.type === "pagespeed") {
		return statusPage.showPageSpeed === false ? null : (
			<PageSpeedMetrics monitor={monitor} />
		);
	}

	if (statusPage.showCharts === false) return null;

	const checks = monitor.checks?.slice().reverse() ?? [];
	return (
		<Box sx={{ overflow: "hidden", minWidth: 0, flex: 1, mb: theme.spacing(SPACING.LG) }}>
			{chartType === "histogram" ? (
				<HistogramResponseTime
					height={{ xs: 50, md: 100 }}
					gap={{ xs: theme.spacing(SPACING.SM), md: theme.spacing(LAYOUT.SM) }}
					checks={checks}
				/>
			) : (
				<HeatmapResponseTime checks={checks} />
			)}
		</Box>
	);
};

export const MonitorsList = ({ statusPage, monitors }: MonitorsListProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const showURL = useSelector((state: RootState) => state.ui?.showURL);
	const [chartType, setChartType] = useState<"histogram" | "heatmap">("histogram");

	return (
		<Stack gap={theme.spacing(LAYOUT.MD)}>
			{statusPage.showCharts && (
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(LAYOUT.SM)}
				>
					<Typography>{t("pages.statusPages.monitorsList.chartTypeHeatmap")}</Typography>
					<SwitchComponent
						dualOption
						value={chartType}
						checked={chartType === "histogram"}
						onChange={(e) => setChartType(e.target.checked ? "histogram" : "heatmap")}
					/>
					<Typography>
						{t("pages.statusPages.monitorsList.chartTypeHistogram")}
					</Typography>
				</Stack>
			)}

			{monitors.map((monitor) => (
				<BaseBox
					key={monitor.id}
					padding={theme.spacing(LAYOUT.MD)}
				>
					<MonitorHeader
						monitor={monitor}
						showURL={showURL}
					/>
					<MonitorContent
						monitor={monitor}
						statusPage={statusPage}
						chartType={chartType}
					/>
				</BaseBox>
			))}
		</Stack>
	);
};
