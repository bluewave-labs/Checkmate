import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import type { CheckSnapshot } from "@/Types/Check";
import { formatCheckTimestamp } from "./timeFormat";

const CELLS = 25;

interface Props {
	checks: CheckSnapshot[];
	classPrefix: string;
}

const classify = (check: CheckSnapshot): "fast" | "med" | "slow" | "down" => {
	if (!check.status) return "down";
	const rt = check.responseTime ?? 0;
	if (rt > 500) return "slow";
	if (rt > 250) return "med";
	return "fast";
};

export const ThemedHeatmap = ({ checks, classPrefix }: Props) => {
	const { t } = useTranslation();

	const source = checks.slice(0, CELLS).reverse();
	const padded: (CheckSnapshot | null)[] = [
		...Array.from({ length: Math.max(0, CELLS - source.length) }, () => null),
		...source,
	];

	return (
		<Box
			className={`${classPrefix}-heatmap`}
			role="img"
			aria-label={t("pages.statusPages.monitorsList.chart.heatmapAria")}
		>
			{padded.map((check, i) => {
				if (!check) {
					return (
						<Box
							key={`empty-${i}`}
							className={`${classPrefix}-heatmap-cell ${classPrefix}-empty`}
						/>
					);
				}
				const cls = classify(check);
				const tooltipContent = (
					<Stack gap={0.25}>
						<Typography
							variant="caption"
							fontWeight={600}
						>
							{check.status
								? `${check.responseTime} ms`
								: t("pages.statusPages.monitorsList.chart.downTooltip")}
						</Typography>
						<Typography
							variant="caption"
							sx={{ opacity: 0.8 }}
						>
							{formatCheckTimestamp(check.createdAt as unknown as string)}
						</Typography>
					</Stack>
				);
				return (
					<Tooltip
						key={check.id ?? i}
						title={tooltipContent}
						arrow
						placement="top"
					>
						<Box
							className={`${classPrefix}-heatmap-cell ${classPrefix}-${cls}`}
							aria-label={`${check.responseTime} ms, ${check.status ? "up" : "down"}`}
						/>
					</Tooltip>
				);
			})}
		</Box>
	);
};
