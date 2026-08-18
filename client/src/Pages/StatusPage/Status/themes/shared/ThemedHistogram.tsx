import { useMemo } from "react";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { formatMs } from "@/Utils/TimeUtils";
import type {
	BarKind,
	ChartCell,
} from "@/Pages/StatusPage/Status/themes/shared/ChartCells";

interface Props {
	cells: ChartCell[];
	containerSx: SxProps<Theme>;
	barSx: (kind: BarKind, heightPct: number) => SxProps<Theme>;
	statsSx: SxProps<Theme>;
	statsGap?: number;
}

export const ThemedHistogram = ({
	cells,
	containerSx,
	barSx,
	statsSx,
	statsGap = 1,
}: Props) => {
	const { t } = useTranslation();

	const { avg, peak } = useMemo(() => {
		const valid = cells.filter((cell) => cell.responseTime > 0);
		const maxRt = valid.length ? Math.max(...valid.map((cell) => cell.responseTime)) : 0;
		const avgRt = valid.length
			? valid.reduce((sum, cell) => sum + cell.responseTime, 0) / valid.length
			: 0;
		return { avg: formatMs(avgRt), peak: formatMs(maxRt) };
	}, [cells]);

	return (
		<Stack gap={statsGap}>
			<Box
				sx={[
					...(Array.isArray(containerSx) ? containerSx : [containerSx]),
					{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` },
				]}
			>
				{cells.map((cell) => {
					if (cell.barKind === "empty") {
						return (
							<Box
								key={cell.key}
								sx={barSx("empty", cell.heightPct)}
							/>
						);
					}
					return (
						<Tooltip
							key={cell.key}
							title={cell.tooltip}
							arrow
							placement="top"
						>
							<Box
								sx={barSx(cell.barKind, cell.heightPct)}
								aria-label={cell.ariaLabel}
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
