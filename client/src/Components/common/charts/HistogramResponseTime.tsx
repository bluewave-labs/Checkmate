import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import type { ResponsiveStyleValue } from "@mui/system";
import type { CheckSnapshot } from "@/Types/Check";
import { HeatmapResponseTimeTooltip } from "./HeatmapResponseTimeTooltip";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MAX_RECENT_CHECKS } from "@/Types/Monitor";

interface HistogramResponseTimeProps {
	checks: CheckSnapshot[];
	height?: ResponsiveStyleValue<number | string>;
	gap?: ResponsiveStyleValue<number | string>;
	showStats?: boolean;
	statsPosition?: "left" | "right";
}

interface ResponseTimeStats {
	max: number | string;
	avg: number | string;
}

const DEFAULT_HEIGHT = 50;

const calculateResponseTimeStats = (checks: CheckSnapshot[]): ResponseTimeStats => {
	if (!Array.isArray(checks) || checks.length === 0) {
		return { max: "-", avg: "-" };
	}

	const validChecks = checks.filter((check) => check.originalResponseTime != null);
	if (validChecks.length === 0) {
		return { max: "-", avg: "-" };
	}

	const responseTimes = validChecks.map((check) => check.originalResponseTime);
	const max = Math.max(...responseTimes);
	const avg = Math.round(
		responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
	);

	return { max, avg };
};

export const HistogramResponseTime = ({
	checks,
	height = DEFAULT_HEIGHT,
	gap,
	showStats = true,
	statsPosition = "right",
}: HistogramResponseTimeProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const stats = useMemo(() => calculateResponseTimeStats(checks), [checks]);

	if (!Array.isArray(checks) || checks.length === 0) return null;

	const data =
		checks.length !== MAX_RECENT_CHECKS
			? [
					...checks,
					...Array(MAX_RECENT_CHECKS - checks.length).fill({ status: "placeholder" }),
				]
			: checks;

	const chartHeight = typeof height === "number" ? `${height}px` : height;
	const gridGap = gap ?? theme.spacing(0.5);

	const statsContent = showStats &&
		(typeof stats.max === "number" || typeof stats.avg === "number") && (
			<Stack
				justifyContent="center"
				alignItems={statsPosition === "left" ? "flex-end" : "flex-start"}
				minWidth={70}
				pr={statsPosition === "left" ? theme.spacing(8) : 0}
				pl={statsPosition === "right" ? theme.spacing(8) : 0}
			>
				<Typography variant="body2">
					{t("common.charts.histogram.avg", { value: stats.avg })}
				</Typography>
				<Typography variant="body2">
					{t("common.charts.histogram.max", { value: stats.max })}
				</Typography>
			</Stack>
		);

	return (
		<Stack
			direction={statsPosition === "left" ? "row-reverse" : "row"}
			alignItems="center"
			width={"100%"}
		>
			<Box sx={{ flex: 1 }}>
				<Box
					width={"100%"}
					display={"grid"}
					gap={gridGap}
					height={chartHeight}
					sx={{
						gridTemplateColumns: `repeat(${MAX_RECENT_CHECKS}, 1fr)`,
						alignItems: "end",
					}}
				>
					{data.map((check, index) => {
						const isPlaceholder = (check as any).status === "placeholder";
						const heightPct = `${Math.max(0, Math.min(100, (check as any).responseTime ?? 0))}%`;
						const barColor =
							check.status === true
								? theme.palette.success.light
								: theme.palette.error.light;
						const bar = (
							<Box
								width={"100%"}
								height={"100%"}
								borderRadius={theme.shape.borderRadius}
								bgcolor={theme.palette.action.hover}
								sx={{
									position: "relative",
									overflow: "hidden",
								}}
							>
								<Box
									width={"100%"}
									height={isPlaceholder ? 0 : heightPct}
									bgcolor={barColor}
									sx={{
										position: "absolute",
										bottom: 0,
										left: 0,
										transition: "height 500ms cubic-bezier(0.4, 0, 0.2, 1)",
									}}
								/>
							</Box>
						);

						return isPlaceholder ? (
							<Box
								height={"100%"}
								key={index}
							>
								{bar}
							</Box>
						) : (
							<HeatmapResponseTimeTooltip
								key={index}
								check={check}
							>
								{bar}
							</HeatmapResponseTimeTooltip>
						);
					})}
				</Box>
			</Box>
			{statsContent}
		</Stack>
	);
};
