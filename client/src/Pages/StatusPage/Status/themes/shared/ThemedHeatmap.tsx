import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { CheckSnapshot } from "@/Types/Check";
import { MAX_RECENT_CHECKS } from "@/Types/Monitor";
import { ThemedChartTooltip } from "@/Pages/StatusPage/Status/themes/shared/ThemedChartTooltip";
import { formatMs } from "@/Utils/TimeUtils";

const CELLS = MAX_RECENT_CHECKS;

export type HeatCellKind = "fast" | "med" | "slow" | "down" | "empty";

interface Props {
	checks: CheckSnapshot[];
	containerSx: SxProps<Theme>;
	cellSx: (kind: HeatCellKind) => SxProps<Theme>;
}

const classify = (check: CheckSnapshot): Exclude<HeatCellKind, "empty"> => {
	if (!check.status) return "down";
	const rt = check.responseTime ?? 0;
	if (rt > 500) return "slow";
	if (rt > 250) return "med";
	return "fast";
};

export const ThemedHeatmap = ({ checks, containerSx, cellSx }: Props) => {
	const { t } = useTranslation();

	const source = checks.slice(-CELLS);
	const padded: (CheckSnapshot | null)[] = [
		...source,
		...Array.from({ length: Math.max(0, CELLS - source.length) }, () => null),
	];

	return (
		<Box
			sx={containerSx}
			role="img"
			aria-label={t("pages.statusPages.monitorsList.chart.heatmapAria")}
		>
			{padded.map((check, i) => {
				if (!check) {
					return (
						<Box
							key={`empty-${i}`}
							sx={cellSx("empty")}
						/>
					);
				}
				const kind = classify(check);
				const tooltipContent = <ThemedChartTooltip check={check} />;
				return (
					<Tooltip
						key={check.id ?? i}
						title={tooltipContent}
						arrow
						placement="top"
					>
						<Box
							sx={cellSx(kind)}
							aria-label={`${formatMs(check.responseTime)}, ${check.status ? "up" : "down"}`}
						/>
					</Tooltip>
				);
			})}
		</Box>
	);
};
