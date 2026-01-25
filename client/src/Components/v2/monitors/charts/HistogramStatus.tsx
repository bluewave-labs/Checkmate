import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseChart } from "@/Components/v2/design-elements";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { formatDateWithTz } from "@/Utils/timeUtils";
import { useTranslation } from "react-i18next";
import { ResponsiveContainer, BarChart, XAxis, Bar, Cell, Tooltip } from "recharts";
import { getResponseTimeColor } from "@/Utils/MonitorUtils";

const XLabel = ({ p1, p2, range }: { p1: any; p2: any; range: string }) => {
	const theme = useTheme();
	const uiTimezone = useSelector((state: any) => state.ui.timezone);
	const dateFormat = range === "day" ? "MMM D, h:mm A" : "MMM D";
	return (
		<>
			<text
				x={0}
				y="100%"
				dy={-3}
				textAnchor="start"
				fontSize={11}
				fill={theme.palette.text.secondary}
			>
				{formatDateWithTz(p1.bucketDate, dateFormat, uiTimezone)}
			</text>
			<text
				x="100%"
				y="100%"
				dy={-3}
				textAnchor="end"
				fontSize={11}
				fill={theme.palette.text.secondary}
			>
				{formatDateWithTz(p2.bucketDate, dateFormat, uiTimezone)}
			</text>
		</>
	);
};

export const HistogramStatus = ({ monitorData, checks = [], range }) => {
	console.log(checks);
	const { t } = useTranslation();
	const theme = useTheme();
	const CustomTooltip = ({ active, payload }: any) => {
		const uiTimezone = useSelector((state: any) => state.ui.timezone);
		if (!active || !payload?.length) return null;
		const d = payload[0]?.payload as any & {
			avgResponseTime?: number;
		};
		const avg = d?.avgResponseTime ?? 0;
		const titleText = t("common.charts.uptime.avgResponseTime");
		const fmt = range === "30d" ? "MMM D, YYYY" : "ddd, MMM D, YYYY, h:mm A";
		let dateLabel = "";
		if (d?.bucketDate) {
			const base = new Date(d.bucketDate);
			const midBucket =
				range === "30d" ? new Date(base.getTime() + 12 * 60 * 60 * 1000) : base;
			dateLabel = formatDateWithTz(midBucket.toISOString(), fmt, uiTimezone);
		}
		return (
			<Stack
				sx={{
					p: 1,
					bgcolor: "background.paper",
					border: 1,
					borderColor: "divider",
					borderRadius: 1,
				}}
			>
				{dateLabel ? (
					<Typography
						sx={{ color: "text.secondary" }}
						variant="caption"
					>
						{dateLabel}
					</Typography>
				) : null}
				<Typography variant="caption">{titleText}</Typography>
				<Typography variant="body2">{Math.floor(avg)} ms</Typography>
			</Stack>
		);
	};

	return (
		<BaseChart
			icon={<TrendingUp />}
			title={"Test"}
		>
			<Stack gap={theme.spacing(8)}>
				<Stack
					position="relative"
					direction="row"
					justifyContent="space-between"
				>
					<Stack>
						<Typography>Checks: {"totalChecks"}</Typography>
					</Stack>
				</Stack>
				<ResponsiveContainer
					width="100%"
					height={155}
				>
					<BarChart data={checks}>
						<XAxis
							stroke={theme.palette.divider}
							height={15}
							tick={false}
							label={
								<XLabel
									p1={checks[0]}
									p2={checks[checks.length - 1]}
									range={range}
								/>
							}
						/>
						<Tooltip
							cursor={false}
							content={<CustomTooltip />}
						/>
						<Bar
							dataKey="avgResponseTime"
							maxBarSize={7}
							background={{ fill: "transparent" }}
						>
							{checks?.map((groupedCheck) => {
								const fillColor = getResponseTimeColor(groupedCheck.avgResponseTime);
								return (
									<Cell
										key={groupedCheck._id}
										fill={theme.palette[fillColor].main}
									/>
								);
							})}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</Stack>
		</BaseChart>
	);
};
