import Stack from "@mui/material/Stack";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { HistogramResponseTime, HeatmapResponseTime } from "@/Components/v2/common";
import { StatusLabel, BaseBox } from "@/Components/v2/design-elements";
import { SwitchComponent } from "@/Components/v2/inputs";

import { useTheme } from "@mui/material/styles";
import { determineState } from "@/Utils/MonitorUtils";
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
			{statusPage.showCharts !== false && (
				<Stack
					direction={"row"}
					alignItems={"center"}
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
				const status = determineState(monitor);
				return (
					<BaseBox
						key={monitor.id}
						padding={theme.spacing(4)}
					>
						<Stack
							direction="row"
							alignItems="center"
							justifyContent="space-between"
							gap={theme.spacing(4)}
							mb={statusPage.showCharts !== false ? theme.spacing(4) : 0}
						>
							<Box>
								<Typography variant="h6">{monitor.name}</Typography>
								{showURL && (
									<Typography
										variant="body2"
										color="text.secondary"
									>
										{monitor.url}
									</Typography>
								)}
							</Box>
							<StatusLabel
								status={status === "up"}
								isActive={monitor.isActive}
							/>
						</Stack>
						{statusPage.showCharts !== false && (
							<Box>
								{chartType === "histogram" ? (
									<HistogramResponseTime
										checks={monitor?.checks?.slice().reverse() ?? []}
									/>
								) : (
									<HeatmapResponseTime
										checks={monitor?.checks?.slice().reverse() ?? []}
									/>
								)}
							</Box>
						)}
					</BaseBox>
				);
			})}
		</Stack>
	);
};
