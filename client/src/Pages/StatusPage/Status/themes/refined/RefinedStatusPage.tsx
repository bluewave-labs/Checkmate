import { useState } from "react";
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
import "./refined.css";

type StatusPageMonitor = Monitor & { checks?: Monitor["recentChecks"] };

interface Props {
	statusPage: StatusPage;
	monitors: StatusPageMonitor[];
}

const PREFIX = "rf";

export const RefinedStatusPage = ({ statusPage, monitors }: Props) => {
	const { t } = useTranslation();
	const [chartMode, setChartMode] = useState<"heatmap" | "histogram">("heatmap");

	const overall = resolveOverallStatus(monitors, t);
	const logoSrc = statusPage.logo?.data
		? `data:${statusPage.logo.contentType};base64,${statusPage.logo.data}`
		: null;

	return (
		<Box className={`${PREFIX}-page`}>
			<Box
				component="header"
				className={`${PREFIX}-top`}
			>
				<Box className={`${PREFIX}-brand`}>
					{logoSrc ? (
						<Box
							component="img"
							src={logoSrc}
							alt={statusPage.companyName}
							className={`${PREFIX}-logo-img`}
						/>
					) : (
						<Box className={`${PREFIX}-logo-mono`}>
							{monoFirstChar(statusPage.companyName)}
						</Box>
					)}
					<span className={`${PREFIX}-company`}>{statusPage.companyName}</span>
				</Box>
			</Box>

			<Box className={`${PREFIX}-hero ${PREFIX}-tone-${overall.tone}`}>
				<Box className={`${PREFIX}-status-dot`} />
				<Box className={`${PREFIX}-status-copy`}>
					<h1 className={`${PREFIX}-hero-title`}>{overall.message}</h1>
					<p className={`${PREFIX}-hero-sub`}>
						{t("pages.statusPages.statusBar.monitoringSummary", {
							count: monitors.length,
						})}
					</p>
				</Box>
				<Box className={`${PREFIX}-hero-icon`}>{overall.icon}</Box>
			</Box>

			{statusPage.showCharts && (
				<Box className={`${PREFIX}-chart-switch-wrap`}>
					<Box
						className={`${PREFIX}-chart-switch`}
						role="radiogroup"
					>
						<button
							type="button"
							role="radio"
							aria-checked={chartMode === "heatmap"}
							className={chartMode === "heatmap" ? `${PREFIX}-active` : ""}
							onClick={() => setChartMode("heatmap")}
						>
							{t("pages.statusPages.monitorsList.chartTypeHeatmap")}
						</button>
						<button
							type="button"
							role="radio"
							aria-checked={chartMode === "histogram"}
							className={chartMode === "histogram" ? `${PREFIX}-active` : ""}
							onClick={() => setChartMode("histogram")}
						>
							{t("pages.statusPages.monitorsList.chartTypeHistogram")}
						</button>
					</Box>
				</Box>
			)}

			<Stack
				component="ul"
				className={`${PREFIX}-monitor-list`}
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
							className={`${PREFIX}-card ${PREFIX}-card-${monitor.status}`}
						>
							<Box className={`${PREFIX}-card-row`}>
								<Box className={`${PREFIX}-card-left`}>
									<Box className={`${PREFIX}-monitor-name`}>{monitor.name}</Box>
									<Box className={`${PREFIX}-monitor-meta`}>
										<span
											className={`${PREFIX}-pill ${PREFIX}-pill-${isHardware ? "hardware" : "default"}`}
										>
											{getMonitorTypeLabel(monitor.type, t)}
										</span>
										{monitor.url && (
											<span
												className={`${PREFIX}-monitor-url`}
												title={monitor.url}
											>
												{monitor.url}
											</span>
										)}
									</Box>
								</Box>
								<span className={`${PREFIX}-badge ${PREFIX}-badge-${badgeTone}`}>
									{t(statusBadgeKey[monitor.status])}
								</span>
							</Box>

							{showInfra && (
								<ThemedInfrastructure
									monitor={monitor}
									classPrefix={PREFIX}
								/>
							)}
							{showChart &&
								(chartMode === "heatmap" ? (
									<ThemedHeatmap
										checks={monitor.recentChecks ?? []}
										classPrefix={PREFIX}
									/>
								) : (
									<ThemedHistogram
										checks={monitor.recentChecks ?? []}
										classPrefix={PREFIX}
									/>
								))}
						</Box>
					);
				})}
			</Stack>

			<Box
				component="footer"
				className={`${PREFIX}-footer`}
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
