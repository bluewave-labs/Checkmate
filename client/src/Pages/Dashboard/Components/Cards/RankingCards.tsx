import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import { LAYOUT } from "@/Utils/Theme/constants";
import { getMonitorPath, getUptimePercentageColor } from "@/Utils/MonitorUtils";
import { DashboardCard, CardMessage } from "../DashboardCard";
import { CardMeterRow, CardRow, CardRowLabel } from "../CardPrimitives";
import { useMonitors } from "../../useDashboardData";

import type { Monitor } from "@/Types/Monitor";

const TOP_N = 5;
// A ranking of one is not a ranking.
const MIN_RANKABLE = 2;

const averageResponseTime = (monitor: Monitor): number | null => {
	const times = (monitor.recentChecks ?? [])
		.map((check) => check.responseTime)
		.filter((value): value is number => typeof value === "number");
	if (times.length === 0) {
		return null;
	}
	return times.reduce((sum, value) => sum + value, 0) / times.length;
};

/** Header reads "top 5 of 12" so a truncated ranking says so. */
const RankingCount = ({ shown, total }: { shown: number; total: number }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<Typography color={theme.palette.text.secondary}>
			{t("pages.dashboard.cards.ranking.topOf", { shown, total })}
		</Typography>
	);
};

export const SlowestMonitorsCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, isValidating, error } = useMonitors();

	const ranked = useMemo(() => {
		return (data?.monitors ?? [])
			.filter((monitor) => monitor.status !== "paused")
			.map((monitor) => ({ monitor, average: averageResponseTime(monitor) }))
			.filter(
				(entry): entry is { monitor: Monitor; average: number } => entry.average !== null
			)
			.sort((a, b) => b.average - a.average);
	}, [data]);

	const slowest = ranked[0]?.average ?? 0;

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.slowestMonitors.title")}
			to="/uptime"
			isLoading={isLoading && !data}
			error={error}
			isStale={isValidating && Boolean(data)}
			action={
				ranked.length >= MIN_RANKABLE ? (
					<RankingCount
						shown={Math.min(TOP_N, ranked.length)}
						total={ranked.length}
					/>
				) : null
			}
		>
			{ranked.length < MIN_RANKABLE ? (
				<CardMessage text={t("pages.dashboard.cards.ranking.notEnough")} />
			) : (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					{ranked.slice(0, TOP_N).map(({ monitor, average }) => (
						<CardRow
							key={monitor.id}
							to={`/${getMonitorPath(monitor.type)}/${monitor.id}`}
						>
							<CardMeterRow
								label={<CardRowLabel primary={monitor.name} />}
								value={average}
								max={slowest}
								color={theme.palette.primary.main}
								trailing={
									<Typography
										color={theme.palette.text.secondary}
										flexShrink={0}
									>
										{Math.round(average)} ms
									</Typography>
								}
							/>
						</CardRow>
					))}
				</Stack>
			)}
		</DashboardCard>
	);
};

export const LowestUptimeCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, isValidating, error } = useMonitors();

	const ranked = useMemo(() => {
		return (
			(data?.monitors ?? [])
				// Paused monitors keep whatever uptime they had, or zero — a paused
				// ping monitor reads 0% and would rank beside a genuinely down one.
				// Neither is a live problem, so neither belongs in a worst-uptime list.
				.filter((monitor) => monitor.status !== "paused")
				.filter(
					(monitor): monitor is Monitor & { uptimePercentage: number } =>
						typeof monitor.uptimePercentage === "number"
				)
				.sort((a, b) => a.uptimePercentage - b.uptimePercentage)
		);
	}, [data]);

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.lowestUptime.title")}
			to="/uptime"
			isLoading={isLoading && !data}
			error={error}
			isStale={isValidating && Boolean(data)}
			action={
				ranked.length >= MIN_RANKABLE ? (
					<RankingCount
						shown={Math.min(TOP_N, ranked.length)}
						total={ranked.length}
					/>
				) : null
			}
		>
			{ranked.length < MIN_RANKABLE ? (
				<CardMessage text={t("pages.dashboard.cards.ranking.notEnough")} />
			) : (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					{ranked.slice(0, TOP_N).map((monitor) => {
						// uptimePercentage is a 0-1 fraction, not 0-100.
						const percentage = monitor.uptimePercentage * 100;
						const palette = getUptimePercentageColor(monitor.uptimePercentage);
						return (
							<CardRow
								key={monitor.id}
								to={`/${getMonitorPath(monitor.type)}/${monitor.id}`}
							>
								<CardMeterRow
									label={<CardRowLabel primary={monitor.name} />}
									value={percentage}
									color={theme.palette[palette].main}
									trailing={
										<Typography
											color={theme.palette[palette].main}
											flexShrink={0}
										>
											{percentage.toFixed(1)}%
										</Typography>
									}
								/>
							</CardRow>
						);
					})}
				</Stack>
			)}
		</DashboardCard>
	);
};
