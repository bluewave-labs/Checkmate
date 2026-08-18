import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useTranslation } from "react-i18next";
import type { SxProps, Theme } from "@mui/material/styles";
import type { Monitor } from "@/Types/Monitor";
import type { StatusPage, StatusPageRange } from "@/Types/StatusPage";
import {
	getMonitorTypeLabel,
	STATUS_PAGE_RANGE_DAYS,
	STATUS_PAGE_RANGES,
} from "@/Types/StatusPage";
import type { StatusPageThemeTokens } from "@/Pages/StatusPage/Status/themes/tokens";
import { ThemedHeatmap } from "@/Pages/StatusPage/Status/themes/shared/ThemedHeatmap";
import { ThemedHistogram } from "@/Pages/StatusPage/Status/themes/shared/ThemedHistogram";
import {
	ThemedInfrastructure,
	type GaugeFillLevel,
} from "@/Pages/StatusPage/Status/themes/shared/ThemedInfrastructure";
import {
	type OverallStatus,
	type OverallTone,
	monitorBadgeTone,
	resolveOverallStatus,
	statusBadgeKey,
} from "@/Pages/StatusPage/Status/themes/shared/overallStatus";
import { useStatusPageTheme } from "@/Pages/StatusPage/Status/themes/StatusPageThemeProvider";
import { formatPercentage } from "@/Utils/FormatUtils";
import {
	checksToCells,
	dailyBucketsToCells,
	type BarKind,
	type HeatCellKind,
} from "@/Pages/StatusPage/Status/themes/shared/ChartCells";

type StatusPageMonitor = Monitor;

export interface BaseStyles {
	page: SxProps<Theme>;
	top: SxProps<Theme>;
	chartSwitchWrap: SxProps<Theme>;
	chartSwitch: SxProps<Theme>;
	chartSwitchButton: (active: boolean) => SxProps<Theme>;
	monitorList: SxProps<Theme>;
	card: SxProps<Theme>;
	cardRow: SxProps<Theme>;
	cardLeft: SxProps<Theme>;
	monitorName: SxProps<Theme>;
	monitorMeta: SxProps<Theme>;
	pill: SxProps<Theme>;
	pillHardware: SxProps<Theme>;
	monitorUrl: SxProps<Theme>;
	badge: (tone: OverallTone) => SxProps<Theme>;
	heatmap: SxProps<Theme>;
	heatmapCell: (kind: HeatCellKind) => SxProps<Theme>;
	histogram: SxProps<Theme>;
	bar: (kind: BarKind, heightPct: number) => SxProps<Theme>;
	chartStats: SxProps<Theme>;
	infra: SxProps<Theme>;
	infraEmpty: SxProps<Theme>;
	gauge: SxProps<Theme>;
	gaugeLabel: SxProps<Theme>;
	gaugeValue: SxProps<Theme>;
	gaugeBar: SxProps<Theme>;
	gaugeFill: (level: GaugeFillLevel, widthPct: number) => SxProps<Theme>;
	gaugeSub: SxProps<Theme>;
	footer: SxProps<Theme>;
}

export interface SlotProps<S extends BaseStyles = BaseStyles> {
	statusPage: StatusPage;
	logoSrc: string | null;
	overall: OverallStatus;
	monitorCount: number;
	styles: S;
}

export interface ThemeConfig<S extends BaseStyles = BaseStyles> {
	createStyles: (tokens: StatusPageThemeTokens, isDark: boolean) => S;
	HeaderSlot: React.ComponentType<SlotProps<S>>;
	HeroSlot: React.ComponentType<SlotProps<S>>;
	overallStatusOptions?: { iconSize?: number; allUpKey?: string };
}

interface Props {
	statusPage: StatusPage;
	monitors: StatusPageMonitor[];
	config: ThemeConfig<any>;
	range: StatusPageRange;
	onRangeChange: (range: StatusPageRange) => void;
	bucketTimezone: string;
}

export const BaseStatusPage = ({
	statusPage,
	monitors,
	config,
	range,
	onRangeChange,
	bucketTimezone,
}: Props) => {
	const { t } = useTranslation();
	const { tokens, mode } = useStatusPageTheme();
	const styles = useMemo(
		() => config.createStyles(tokens, mode === "dark"),
		[config, tokens, mode]
	);
	const [chartMode, setChartMode] = useState<"heatmap" | "histogram">("heatmap");

	const overall = resolveOverallStatus(monitors, t, config.overallStatusOptions);
	const logoSrc = statusPage.logo?.data
		? `data:${statusPage.logo.contentType};base64,${statusPage.logo.data}`
		: null;

	const { HeaderSlot, HeroSlot } = config;

	return (
		<Box sx={styles.page}>
			{statusPage.customCSS && <style>{statusPage.customCSS}</style>}
			<Stack
				component="header"
				direction={{ xs: "column", md: "row" }}
				sx={styles.top}
			>
				<HeaderSlot
					statusPage={statusPage}
					logoSrc={logoSrc}
					overall={overall}
					monitorCount={monitors.length}
					styles={styles}
				/>
			</Stack>

			<HeroSlot
				statusPage={statusPage}
				logoSrc={logoSrc}
				overall={overall}
				monitorCount={monitors.length}
				styles={styles}
			/>

			{statusPage.showCharts && (
				<Stack>
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
					<Box sx={styles.chartSwitchWrap}>
						<Box
							sx={styles.chartSwitch}
							role="radiogroup"
							aria-label={t("pages.statusPages.rangeSelectorAria")}
						>
							{STATUS_PAGE_RANGES.map((value) => (
								<Box
									component="button"
									type="button"
									role="radio"
									key={value}
									aria-checked={range === value}
									onClick={() => onRangeChange(value)}
									sx={styles.chartSwitchButton(range === value)}
								>
									{t(`pages.statusPages.range.${value}`)}
								</Box>
							))}
						</Box>
					</Box>
				</Stack>
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
					const uptimePercentage = formatPercentage(monitor.uptimePercentage ?? 0);

					const cells =
						range === "latest"
							? checksToCells(monitor.recentChecks ?? [])
							: dailyBucketsToCells(
									monitor.dailyChecks ?? [],
									STATUS_PAGE_RANGE_DAYS[range],
									bucketTimezone,
									t
								);

					return (
						<Box
							component="li"
							key={monitor.id}
							sx={styles.card}
						>
							<Box sx={styles.cardRow}>
								<Box sx={styles.monitorName}>{monitor.name}</Box>
								<Box
									component="span"
									sx={styles.badge(badgeTone)}
								>
									{t(statusBadgeKey[monitor.status])}
								</Box>
								<Stack
									direction={{ xs: "column", md: "row" }}
									sx={styles.monitorMeta}
								>
									<Box
										component="span"
										sx={isHardware ? styles.pillHardware : styles.pill}
									>
										{getMonitorTypeLabel(monitor.type, t)}
									</Box>
									<Box
										component="span"
										sx={{ ...styles.pill }}
									>
										{uptimePercentage}
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
								</Stack>
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
										cells={cells}
										containerSx={styles.heatmap}
										cellSx={styles.heatmapCell}
									/>
								) : (
									<ThemedHistogram
										cells={cells}
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
