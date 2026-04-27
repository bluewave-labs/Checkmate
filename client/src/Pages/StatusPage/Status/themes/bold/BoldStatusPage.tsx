import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useTranslation } from "react-i18next";
import type { Monitor } from "@/Types/Monitor";
import type { StatusPage } from "@/Types/StatusPage";
import { getMonitorTypeLabel } from "@/Types/StatusPage";
import { ThemedHeatmap } from "../shared/ThemedHeatmap";
import { ThemedHistogram } from "../shared/ThemedHistogram";
import { ThemedInfrastructure } from "../shared/ThemedInfrastructure";
import {
	monitorBadgeTone,
	monoFirstChar,
	resolveOverallStatus,
	statusBadgeKey,
} from "../shared/overallStatus";
import { useStatusPageTheme } from "../StatusPageThemeProvider";
import { boldStyles } from "./styles";

type StatusPageMonitor = Monitor & { checks?: Monitor["recentChecks"] };

interface Props {
	statusPage: StatusPage;
	monitors: StatusPageMonitor[];
}

export const BoldStatusPage = ({ statusPage, monitors }: Props) => {
	const { t } = useTranslation();
	const { tokens, mode } = useStatusPageTheme();
	const styles = useMemo(() => boldStyles(tokens, mode === "dark"), [tokens, mode]);
	const [chartMode, setChartMode] = useState<"heatmap" | "histogram">("heatmap");

	const overall = resolveOverallStatus(monitors, t, { iconSize: 18 });
	const logoSrc = statusPage.logo?.data
		? `data:${statusPage.logo.contentType};base64,${statusPage.logo.data}`
		: null;

	return (
		<Box sx={styles.page}>
			<Box
				component="header"
				sx={styles.top}
			>
				<Box sx={styles.brand}>
					{logoSrc ? (
						<Box
							component="img"
							src={logoSrc}
							alt={statusPage.companyName}
							sx={styles.logoImg}
						/>
					) : (
						<Box sx={styles.logoConic}>{monoFirstChar(statusPage.companyName)}</Box>
					)}
					<Box
						component="span"
						sx={styles.company}
					>
						{statusPage.companyName}
					</Box>
				</Box>
			</Box>

			<Box sx={styles.hero}>
				<Box
					component="h1"
					sx={styles.heroTitle}
				>
					<Box
						component="span"
						sx={styles.heroCheck(overall.tone)}
					>
						{overall.icon}
					</Box>
					{overall.message}
				</Box>
				<Box
					component="p"
					sx={styles.heroSub}
				>
					{t("pages.statusPages.statusBar.monitoringSummary", {
						count: monitors.length,
					})}
				</Box>
			</Box>

			{statusPage.showCharts && (
				<Box sx={styles.chartSwitchWrap}>
					<Box
						sx={styles.chartSwitch}
						role="radiogroup"
					>
						<Box
							component="button"
							type="button"
							role="radio"
							aria-checked={chartMode === "heatmap"}
							onClick={() => setChartMode("heatmap")}
							sx={styles.chartSwitchButton(chartMode === "heatmap")}
						>
							{t("pages.statusPages.monitorsList.chartTypeHeatmap")}
						</Box>
						<Box
							component="button"
							type="button"
							role="radio"
							aria-checked={chartMode === "histogram"}
							onClick={() => setChartMode("histogram")}
							sx={styles.chartSwitchButton(chartMode === "histogram")}
						>
							{t("pages.statusPages.monitorsList.chartTypeHistogram")}
						</Box>
					</Box>
				</Box>
			)}

			<Stack
				component="ul"
				sx={styles.monitorList}
			>
				{monitors.map((monitor) => {
					const isHardware = monitor.type === "hardware";
					const showInfra = isHardware && statusPage.showInfrastructure !== false;
					const showChart = !isHardware && statusPage.showCharts !== false;
					const badgeTone = monitorBadgeTone(monitor.status);

					return (
						<Box
							component="li"
							key={monitor.id}
							sx={styles.card}
						>
							<Box sx={styles.cardRow}>
								<Box sx={styles.cardLeft}>
									<Box sx={styles.monitorName}>{monitor.name}</Box>
									<Box sx={styles.monitorMeta}>
										<Box
											component="span"
											sx={isHardware ? styles.pillHardware : styles.pill}
										>
											{getMonitorTypeLabel(monitor.type, t)}
										</Box>
										{monitor.url && (
											<Box
												component="span"
												sx={styles.monitorUrl}
												title={monitor.url}
											>
												{monitor.url}
											</Box>
										)}
									</Box>
								</Box>
								<Box
									component="span"
									sx={styles.badge(badgeTone)}
								>
									{t(statusBadgeKey[monitor.status])}
								</Box>
							</Box>

							{showInfra && (
								<ThemedInfrastructure
									monitor={monitor}
									sxApi={{
										containerSx: styles.infra,
										emptySx: styles.infraEmpty,
										gaugeSx: styles.gauge,
										gaugeLabelSx: styles.gaugeLabel,
										gaugeValueSx: styles.gaugeValue,
										gaugeBarSx: styles.gaugeBar,
										gaugeFillSx: styles.gaugeFill,
										gaugeSubSx: styles.gaugeSub,
									}}
								/>
							)}
							{showChart &&
								(chartMode === "heatmap" ? (
									<ThemedHeatmap
										checks={monitor.recentChecks ?? []}
										containerSx={styles.heatmap}
										cellSx={styles.heatmapCell}
									/>
								) : (
									<ThemedHistogram
										checks={monitor.recentChecks ?? []}
										containerSx={styles.histogram}
										barSx={styles.bar}
										statsSx={styles.chartStats}
									/>
								))}
						</Box>
					);
				})}
			</Stack>

			<Box
				component="footer"
				sx={styles.footer}
			>
				{t("pages.statusPages.footer.poweredBy")}{" "}
				<a
					href="https://checkmate.so"
					target="_blank"
					rel="noopener noreferrer"
				>
					Checkmate
				</a>
			</Box>
		</Box>
	);
};
