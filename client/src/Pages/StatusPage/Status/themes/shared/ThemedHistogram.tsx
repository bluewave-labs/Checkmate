import { useMemo } from "react";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { CheckSnapshot } from "@/Types/Check";
import { MAX_RECENT_CHECKS } from "@/Types/Monitor";
import { useStatusPageTheme } from "../StatusPageThemeProvider";
import { computeBarHeights } from "@/Utils/DataUtils";
import { ThemedChartTooltip } from "@/Pages/StatusPage/Status/themes/shared/ThemedChartTooltip";
const CELLS = MAX_RECENT_CHECKS;
const MIN_HEIGHT_PCT = 6;

export type BarKind = "up" | "down" | "empty";

interface Props {
	checks: CheckSnapshot[];
	containerSx: SxProps<Theme>;
	barSx: (kind: BarKind, heightPct: number) => SxProps<Theme>;
	statsSx: SxProps<Theme>;
	statsGap?: number;
}

const tone = (check: CheckSnapshot): Exclude<BarKind, "empty"> =>
	check.status ? "up" : "down";

export const ThemedHistogram = ({
	checks,
	containerSx,
	barSx,
	statsSx,
	statsGap = 1,
}: Props) => {
	const { t } = useTranslation();

	const { padded, heights, avg, peak } = useMemo(() => {
		const source = checks.slice(-CELLS);
		const out: (CheckSnapshot | null)[] = [
			...source,
			...Array.from({ length: Math.max(0, CELLS - source.length) }, () => null),
		];
		const heights = computeBarHeights(source);
		const valid = out.filter((c): c is CheckSnapshot => c !== null && c.responseTime > 0);
		const maxRt = valid.length ? Math.max(...valid.map((c) => c.responseTime)) : 1;
		const avgRt = valid.length
			? Math.round(valid.reduce((s, c) => s + c.responseTime, 0) / valid.length)
			: 0;
		return { padded: out, heights, avg: avgRt, peak: maxRt };
	}, [checks]);

	return (
		<Stack gap={statsGap}>
			<Box sx={containerSx}>
				{padded.map((check, i) => {
					if (!check) {
						return (
							<Box
								key={`empty-${i}`}
								sx={barSx("empty", MIN_HEIGHT_PCT)}
							/>
						);
					}
					const height = heights[i] ?? MIN_HEIGHT_PCT;
					const tooltipContent = <ThemedChartTooltip check={check} />;
					return (
						<Tooltip
							key={check.id ?? i}
							title={tooltipContent}
							arrow
							placement="top"
						>
							<Box
								sx={barSx(tone(check), height)}
								aria-label={`${check.responseTime} ms`}
							/>
						</Tooltip>
					);
				})}
			</Box>
			<Stack
				direction="row"
				justifyContent="space-between"
				sx={statsSx}
			>
				<span>{t("pages.statusPages.monitorsList.chart.avg", { value: avg })}</span>
				<span>{t("pages.statusPages.monitorsList.chart.max", { value: peak })}</span>
			</Stack>
		</Stack>
	);
};
