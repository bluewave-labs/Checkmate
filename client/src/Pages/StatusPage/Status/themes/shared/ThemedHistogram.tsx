import { useMemo } from "react";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { CheckSnapshot } from "@/Types/Check";
import { formatCheckTimestamp } from "./timeFormat";

const CELLS = 25;
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

	const { padded, max, avg, peak } = useMemo(() => {
		const source = checks.slice(0, CELLS).reverse();
		const out: (CheckSnapshot | null)[] = [
			...Array.from({ length: Math.max(0, CELLS - source.length) }, () => null),
			...source,
		];
		const valid = out.filter((c): c is CheckSnapshot => c !== null && c.responseTime > 0);
		const maxRt = valid.length ? Math.max(...valid.map((c) => c.responseTime)) : 1;
		const avgRt = valid.length
			? Math.round(valid.reduce((s, c) => s + c.responseTime, 0) / valid.length)
			: 0;
		return { padded: out, max: maxRt, avg: avgRt, peak: valid.length ? maxRt : 0 };
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
					const height = Math.max(
						MIN_HEIGHT_PCT,
						Math.round((check.responseTime / max) * 100)
					);
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
								{formatCheckTimestamp(check.createdAt)}
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
