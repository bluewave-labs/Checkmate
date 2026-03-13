import Stack from "@mui/material/Stack";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { HistogramResponseTime, HeatmapResponseTime } from "@/Components/common";
import { StatusLabel, BaseBox } from "@/Components/design-elements";
import { SwitchComponent } from "@/Components/inputs";
import { InfrastructureMetrics } from "@/Pages/StatusPage/Status/Components/InfrastructureMetrics";

import { useTheme, type Theme } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { useState } from "react";
import type { Monitor } from "@/Types/Monitor";
import type { StatusPage } from "@/Types/StatusPage";
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
	// for future: specific badge styles can be defined here based on monitor type
	const badgeConfig: Record<string, { color: string; bg: string }> = {
		hardware: {
			color: theme.palette.background.paper,
			bg: theme.palette.info.light,
		},
		http: {
			color: theme.palette.background.paper,
			bg: theme.palette.success.light,
		},
		ping: {
			color: theme.palette.background.paper,
			bg: theme.palette.success.light,
		},
		port: {
			color: theme.palette.background.paper,
			bg: theme.palette.success.light,
		},
		docker: {
			color: theme.palette.background.paper,
			bg: theme.palette.success.light,
		},
		pagespeed: {
			color: theme.palette.background.paper,
			bg: theme.palette.success.light,
		},
		game: {
			color: theme.palette.background.paper,
			bg: theme.palette.success.light,
		},
	};

	const config = badgeConfig[monitorType] ?? badgeConfig.http;
	return {
		backgroundColor: config.bg,
		color: config.color,
		padding: `${theme.spacing(SPACING.SM)} ${theme.spacing(SPACING.LG)}`,
		borderRadius: theme.shape.borderRadius,
	};
};

// Extracted component for monitor content below the header row
const MonitorContent = ({
	monitor,
	statusPage,
	chartType,
}: {
	monitor: Monitor & { checks?: Monitor["recentChecks"] };
	statusPage: StatusPage;
	chartType: string;
}) => {
	const theme = useTheme();
	const isInfrastructureMonitor = monitor?.type === "hardware";

	if (isInfrastructureMonitor) {
		if (statusPage.showInfrastructure === false) {
			return null;
		}
		return <InfrastructureMetrics monitor={monitor} />;
	}

	if (statusPage.showCharts === false) {
		return null;
	}

	return (
		<Box sx={{ overflow: "hidden", minWidth: 0, flex: 1, mb: theme.spacing(SPACING.LG) }}>
			{chartType === "histogram" ? (
				<HistogramResponseTime
					height={{ xs: 50, md: 100 }}
					gap={{ xs: theme.spacing(SPACING.SM), md: theme.spacing(LAYOUT.SM) }}
					checks={monitor?.checks?.slice().reverse() ?? []}
				/>
			) : (
				<HeatmapResponseTime checks={monitor?.checks?.slice().reverse() ?? []} />
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
					direction={"row"}
					alignItems={"center"}
					gap={theme.spacing(LAYOUT.SM)}
				>
					<Typography>{t("pages.statusPages.monitorsList.chartTypeHeatmap")}</Typography>
					<SwitchComponent
						dualOption
						value={chartType}
						checked={chartType === "histogram"}
						onChange={(e) => {
							setChartType(e.target.checked ? "histogram" : "heatmap");
						}}
					/>
					<Typography>
						{t("pages.statusPages.monitorsList.chartTypeHistogram")}
					</Typography>
				</Stack>
			)}

			{monitors?.map((monitor) => {
				return (
					<BaseBox
						key={monitor.id}
						padding={theme.spacing(LAYOUT.MD)}
					>
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
										sx={{
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{monitor.name}
									</Typography>
									<Typography
										variant="caption"
										sx={getMonitorBadgeStyles(monitor?.type ?? "", theme)}
									>
										{t(
											`pages.common.monitors.monitorTypes.option${monitor?.type.charAt(0).toUpperCase() + monitor?.type.slice(1)}`
										)}
									</Typography>
								</Stack>
								{showURL && monitor?.url && (
									<Typography
										variant="body2"
										color={theme.palette.text.secondary}
										sx={{
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{monitor.url}
									</Typography>
								)}
							</Box>
							<StatusLabel status={monitor?.status} />
						</Stack>
						<MonitorContent
							monitor={monitor}
							statusPage={statusPage}
							chartType={chartType}
						/>
					</BaseBox>
				);
			})}
		</Stack>
	);
};
