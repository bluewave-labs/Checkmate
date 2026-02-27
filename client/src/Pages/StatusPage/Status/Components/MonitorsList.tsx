import Stack from "@mui/material/Stack";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { HistogramResponseTime, HeatmapResponseTime } from "@/Components/common";
import { StatusLabel, BaseBox } from "@/Components/design-elements";
import { SwitchComponent } from "@/Components/inputs";
import { InfrastructureMetrics } from "@/Pages/StatusPage/Status/Components/InfrastructureMetrics";

import { useTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { useState } from "react";
import type { Monitor } from "@/Types/Monitor";
import type { StatusPage } from "@/Types/StatusPage";
import type { RootState } from "@/Types/state";

interface StatusPageMonitor extends Monitor {
	checks?: Monitor["recentChecks"];
}

interface MonitorsListProps {
	statusPage: StatusPage;
	monitors: StatusPageMonitor[];
}

export const MonitorsList = ({ statusPage, monitors }: MonitorsListProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const showURL = useSelector((state: RootState) => state.ui?.showURL);

	const [chartType, setChartType] = useState<"histogram" | "heatmap">("histogram");

	return (
		<Stack gap={theme.spacing(8)}>
			{statusPage.showCharts && (
				<Stack
					direction={"row"}
					alignItems={"center"}
					gap={theme.spacing(2)}
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
				const isInfrastructureMonitor = monitor?.type === "hardware";
				return (
					<BaseBox
						key={monitor.id}
						padding={theme.spacing(8)}
					>
						<Stack
							direction="row"
							alignItems="center"
							justifyContent="space-between"
							gap={theme.spacing(4)}
							mb={theme.spacing(4)}
						>
							<Box sx={{ overflow: "hidden", minWidth: 0, flex: 1 }}>
								<Stack
									direction="row"
									alignItems="center"
									gap={theme.spacing(2)}
									mb={theme.spacing(1)}
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
										sx={{
											backgroundColor:
												monitor?.type === "hardware"
													? theme.palette.info.light
													: theme.palette.success.light,
											color:
												monitor?.type === "hardware"
													? theme.palette.info.dark
													: theme.palette.success.dark,
											padding: `${theme.spacing(0.5)} ${theme.spacing(1.5)}`,
											borderRadius: theme.shape.borderRadius,
											fontWeight: 600,
										}}
									>
										{t(`pages.statusPages.monitorsList.badge.${monitor?.type}`)}
									</Typography>
								</Stack>
								{showURL && monitor?.url && (
									<Typography
										variant="body2"
										color="text.secondary"
									>
										{monitor.url}
									</Typography>
								)}
							</Box>
							<StatusLabel status={monitor?.status} />
						</Stack>

						{!isInfrastructureMonitor && (
							<>
								{statusPage.showCharts !== false && (
									<Box
										sx={{
											overflow: "hidden",
											minWidth: 0,
											flex: 1,
											mb: theme.spacing(2),
										}}
									>
										{chartType === "histogram" ? (
											<HistogramResponseTime
												height={{ xs: 50, md: 100 }}
												gap={{ xs: theme.spacing(0.5), md: theme.spacing(5) }}
												checks={monitor?.checks?.slice().reverse() ?? []}
											/>
										) : (
											<HeatmapResponseTime
												checks={monitor?.checks?.slice().reverse() ?? []}
											/>
										)}
									</Box>
								)}
							</>
						)}

						{isInfrastructureMonitor && statusPage.showInfrastructure !== false && (
							<BaseBox
								key={monitor.id}
								padding={theme.spacing(4)}
							>
								<Stack
									direction="row"
									alignItems="center"
									justifyContent="space-between"
									gap={theme.spacing(8)}
								></Stack>
								<InfrastructureMetrics monitor={monitor} />
							</BaseBox>
						)}
					</BaseBox>
				);
			})}
		</Stack>
	);
};
