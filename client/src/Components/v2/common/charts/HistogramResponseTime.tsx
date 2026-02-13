import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import type { ResponsiveStyleValue } from "@mui/system";
import type { CheckSnapshot } from "@/Types/Check";
import { HeatmapResponseTimeTooltip } from "./HeatmapResponseTimeTooltip";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface HistogramResponseTimeProps {
	checks: CheckSnapshot[];
	height?: ResponsiveStyleValue<number | string>;
	gap?: ResponsiveStyleValue<number | string>;
	showStats?: boolean;
	statsPosition?: "left" | "right";
}

interface ResponseTimeStats {
	max: number;
	avg: number;
}

const DEFAULT_HEIGHT = 50;

const calculateResponseTimeStats = (checks: CheckSnapshot[]): ResponseTimeStats => {
	if (!Array.isArray(checks) || checks.length === 0) {
		return { max: 0, avg: 0 };
	}

	const validChecks = checks.filter(
		(check) =>
			(check as any).status !== "placeholder" &&
			(check.originalResponseTime != null || check.responseTime != null)
	);

	if (validChecks.length === 0) {
		return { max: 0, avg: 0 };
	}

	const responseTimes = validChecks.map(
		(check) => check.originalResponseTime ?? check.responseTime ?? 0
	);

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
		checks.length !== 25
			? [...checks, ...Array(25 - checks.length).fill({ status: "placeholder" })]
			: checks;

	const chartHeight = typeof height === "number" ? `${height}px` : height;
	const gridGap = gap ?? theme.spacing(0.5);

	const statsContent = showStats && (stats.max > 0 || stats.avg > 0) && (
		<Stack
			justifyContent="center"
			alignItems={statsPosition === "left" ? "flex-end" : "flex-start"}
			sx={{
				minWidth: 70,
				pr: statsPosition === "left" ? theme.spacing(2) : 0,
				pl: statsPosition === "right" ? theme.spacing(2) : 0,
			}}
		>
			<Typography
				variant="caption"
				sx={{
					color: theme.palette.text.secondary,
					fontSize: "0.65rem",
					fontWeight: 500,
					lineHeight: 1.4,
				}}
			>
				{t("common.charts.histogram.avg", { value: stats.avg })}
			</Typography>
			<Typography
				variant="caption"
				sx={{
					color: theme.palette.text.secondary,
					fontSize: "0.65rem",
					fontWeight: 500,
					lineHeight: 1.4,
				}}
			>
				{t("common.charts.histogram.max", { value: stats.max })}
			</Typography>
		</Stack>
	);

	return (
		<Stack
			direction="row"
			alignItems="center"
			sx={{ width: "100%" }}
		>
			{statsPosition === "left" && statsContent}
			<Box sx={{ flex: 1 }}>
				<Box
					sx={{
						width: "100%",
						display: "grid",
						gridTemplateColumns: "repeat(25, 1fr)",
						gap: gridGap,
						alignItems: "end",
						height: chartHeight,
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
								sx={{
									position: "relative",
									width: "100%",
									height: "100%",
									borderRadius: theme.spacing(1),
									bgcolor: theme.palette.action.hover,
									overflow: "hidden",
								}}
							>
								<Box
									sx={{
										position: "absolute",
										bottom: 0,
										left: 0,
										width: "100%",
										height: isPlaceholder ? 0 : heightPct,
										bgcolor: barColor,
										transition: "height 500ms cubic-bezier(0.4, 0, 0.2, 1)",
									}}
								/>
							</Box>
						);

						return isPlaceholder ? (
							<Box
								key={index}
								sx={{ height: "100%" }}
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
			{statsPosition === "right" && statsContent}
		</Stack>
	);
};
