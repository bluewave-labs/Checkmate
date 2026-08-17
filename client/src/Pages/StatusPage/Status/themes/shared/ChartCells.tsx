import {
	ThemedChartTooltip,
	ThemedDailyTooltip,
} from "@/Pages/StatusPage/Status/themes/shared/ThemedChartTooltip";
import type { CheckSnapshot, DailyCheckBucket } from "@/Types/Check";
import { MAX_RECENT_CHECKS } from "@/Types/Monitor";
import {
	computeBarHeights,
	computeDayBarHeights,
	MIN_HEIGHT_PCT,
} from "@/Utils/DataUtils";
import { formatPercentage } from "@/Utils/FormatUtils";
import { enumerateDays, formatMs } from "@/Utils/TimeUtils";
import type { TFunction } from "i18next";

export type BarKind = "up" | "degraded" | "down" | "empty";
export type HeatCellKind = "fast" | "med" | "slow" | "degraded" | "down" | "empty";

export interface ChartCell {
	key: string;
	barKind: BarKind;
	heatKind: HeatCellKind;
	heightPct: number; // histogram bar height
	responseTime: number; // 0 for empty cells
	tooltip: React.ReactNode | null;
	ariaLabel: string;
}

const DAY_DOWN_THRESHOLD = 0.5;

const classifyDay = (bucket: DailyCheckBucket): BarKind => {
	if (bucket.totalChecks === 0) return "empty";
	const upRatio = bucket.upChecks / bucket.totalChecks;
	if (upRatio >= 1) return "up";
	if (upRatio < DAY_DOWN_THRESHOLD) return "down";
	return "degraded";
};

export const classifyResponseTime = (
	status: boolean,
	responseTime: number | undefined
): Exclude<HeatCellKind, "empty"> => {
	if (!status) return "down";
	const rt = responseTime ?? 0;
	if (rt > 500) return "slow";
	if (rt > 250) return "med";
	return "fast";
};

const emptyCell = (key: string): ChartCell => ({
	key,
	barKind: "empty",
	heatKind: "empty",
	heightPct: MIN_HEIGHT_PCT,
	responseTime: 0,
	tooltip: null,
	ariaLabel: "",
});

const padCells = (cells: ChartCell[], length: number): ChartCell[] => [
	...cells,
	...Array.from({ length: Math.max(0, length - cells.length) }, (_, i) =>
		emptyCell(`empty-${cells.length + i}`)
	),
];

export const checksToCells = (checks: CheckSnapshot[], t: TFunction): ChartCell[] => {
	const source = checks.slice(-MAX_RECENT_CHECKS);
	const heights = computeBarHeights(source);
	const cells = source.map(
		(check, i): ChartCell => ({
			key: check.id ?? String(i),
			barKind: check.status ? "up" : "down",
			heatKind: classifyResponseTime(check.status, check.responseTime),
			heightPct: heights[i] ?? MIN_HEIGHT_PCT,
			responseTime: check.responseTime ?? 0,
			tooltip: <ThemedChartTooltip check={check} />,
			ariaLabel: `${formatMs(check.responseTime)}, ${check.status ? "up" : "down"}`,
		})
	);
	return padCells(cells, MAX_RECENT_CHECKS);
};

export const dailyBucketsToCells = (
	buckets: DailyCheckBucket[],
	days: number,
	bucketTimezone: string,
	t: TFunction
): ChartCell[] => {
	const byDate = new Map(buckets.map((b) => [b.date, b]));
	const heights = computeDayBarHeights(buckets);
	const enumerated = enumerateDays(days, bucketTimezone);
	return enumerated.map((date) => {
		const bucket = byDate.get(date);
		if (!bucket) return emptyCell(`day-${date}`);
		const barKind = classifyDay(bucket);
		return {
			key: `day-${date}`,
			barKind,
			heatKind:
				barKind === "up"
					? classifyResponseTime(true, bucket.avgResponseTime ?? 0)
					: barKind, // degraded/down days keep their outcome color in the heatmap too
			heightPct: heights.get(date) ?? MIN_HEIGHT_PCT,
			responseTime: bucket.avgResponseTime ?? 0, // null (no RT data that day) → 0, excluded from footer stats like empty cells
			tooltip: <ThemedDailyTooltip bucket={bucket} />,
			ariaLabel: t("pages.statusPages.monitorsList.chart.dayAria", {
				date,
				uptime: formatPercentage(bucket.upChecks / bucket.totalChecks),
			}),
		};
	});
};
