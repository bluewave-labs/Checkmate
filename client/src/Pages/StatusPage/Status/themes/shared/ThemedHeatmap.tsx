import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type {
	ChartCell,
	HeatCellKind,
} from "@/Pages/StatusPage/Status/themes/shared/ChartCells";

interface Props {
	cells: ChartCell[];
	containerSx: SxProps<Theme>;
	cellSx: (kind: HeatCellKind, severity?: number) => SxProps<Theme>;
}

export const ThemedHeatmap = ({ cells, containerSx, cellSx }: Props) => {
	const { t } = useTranslation();

	return (
		<Box
			sx={[
				...(Array.isArray(containerSx) ? containerSx : [containerSx]),
				{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` },
			]}
			role="img"
			aria-label={t("pages.statusPages.monitorsList.chart.heatmapAria")}
		>
			{cells.map((cell) => {
				if (cell.heatKind === "empty") {
					return (
						<Box
							key={cell.key}
							sx={cellSx("empty")}
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
							sx={cellSx(cell.heatKind, cell.severity)}
							aria-label={cell.ariaLabel}
						/>
					</Tooltip>
				);
			})}
		</Box>
	);
};
