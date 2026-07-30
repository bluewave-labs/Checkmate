import Stack from "@mui/material/Stack";
import { BaseChart, BaseBox } from "@/Components/design-elements";
import { Clock } from "lucide-react";
import { Dot } from "@/Components/design-elements";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	ResponsiveContainer,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import Typography from "@mui/material/Typography";
import prettyMilliseconds from "pretty-ms";
import { XTick } from "@/Components/monitors/charts/XTick";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { formatDateWithTz, tooltipDateFormatLookup } from "@/Utils/TimeUtils";
import { useTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import type { GroupedCheck, GroupedUptimeCheck } from "@/Types/Check";
import type { RootState } from "@/Types/state";
import { computeYAxisCap } from "@/Components/monitors/charts/ChartUtils";

import { useMemo, useState } from "react";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";
import {
	PHASE_COLOR_KEYS,
	PHASE_KEYS,
	PHASE_LABEL_KEYS,
} from "@/Components/monitors/charts/ChartUtils";

type DetailsCheck = GroupedCheck &
	Partial<Pick<GroupedUptimeCheck, (typeof PHASE_KEYS)[number]>>;

type ResponseTimeToolTipProps = TooltipProps<ValueType, NameType> & {
	range: string;
	theme: Theme;
	uiTimezone: string;
};

const ResponseTimeToolTip = ({
	active,
	payload,
	label,
	range,
	theme,
	uiTimezone,
}: ResponseTimeToolTipProps) => {
	const { t } = useTranslation();
	if (!label) return null;
	if (!payload) return null;
	if (!active) return null;

	const format = tooltipDateFormatLookup(range);
	const responseTime = Math.floor(payload[0]?.payload?.avgResponseTime || 0);
	return (
		<BaseBox sx={{ py: theme.spacing(2), px: theme.spacing(4) }}>
			<Typography>{formatDateWithTz(String(label), format, uiTimezone)}</Typography>
			<Typography>
				{t("common.charts.histogram.responseTime", {
					value: prettyMilliseconds(responseTime, {
						formatSubMilliseconds: true,
						compact: true,
					}),
				})}
			</Typography>
		</BaseBox>
	);
};

type TimingPhaseToolTipProps = TooltipProps<ValueType, NameType> & {
	range: string;
	theme: Theme;
	uiTimezone: string;
};

const TimingPhasesToolTip = ({
	active,
	payload,
	range,
	theme,
	uiTimezone,
}: TimingPhaseToolTipProps) => {
	const { t } = useTranslation();
	if (!active || !payload?.length) return null;
	const bucket = payload[0].payload as GroupedUptimeCheck;
	const total = PHASE_KEYS.reduce((sum, key) => sum + bucket[key], 0);
	const format = tooltipDateFormatLookup(range);
	return (
		<BaseBox sx={{ py: theme.spacing(2), px: theme.spacing(4) }}>
			<Typography>{formatDateWithTz(bucket.bucketDate, format, uiTimezone)}</Typography>
			<Typography>
				{t("common.charts.histogram.total", { value: prettyMilliseconds(total) })}
			</Typography>
			{PHASE_KEYS.map((key) => (
				<Stack
					alignItems={"center"}
					direction="row"
					key={key}
					gap={SPACING.LG}
				>
					<Dot
						size="lg"
						color={theme.palette.chart.phases[PHASE_COLOR_KEYS[key]]}
					/>
					<Typography>
						{t(PHASE_LABEL_KEYS[key])}:{" "}
						{prettyMilliseconds(bucket[key], {
							formatSubMilliseconds: true,
							compact: true,
						})}
					</Typography>
				</Stack>
			))}
		</BaseBox>
	);
};

export const HistogramDetails = ({
	checks,
	range,
}: {
	checks: DetailsCheck[];
	range: string;
}) => {
	const [showTimingPhases, setShowTimingPhases] = useState(false);
	const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

	const { t } = useTranslation();
	const theme = useTheme();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);
	const yMax = useMemo(() => {
		const totals = checks.map((check) => {
			const phaseSum = PHASE_KEYS.reduce((sum, key) => sum + (check[key] ?? 0), 0);
			return Math.max(check.avgResponseTime ?? 0, phaseSum);
		});
		return computeYAxisCap(totals);
	}, [checks]);

	const hasTimingPhases = useMemo(
		() => (checks ?? []).some((check) => PHASE_KEYS.some((key) => (check[key] ?? 0) > 0)),
		[checks]
	);

	return (
		<BaseChart
			icon={
				<Clock
					size={20}
					strokeWidth={1.5}
				/>
			}
			title={
				showTimingPhases
					? t("common.charts.labels.timingPhases")
					: t("common.charts.labels.responseTime")
			}
			onClick={() => {
				if (!hasTimingPhases) return;
				setShowTimingPhases((prev) => !prev);
			}}
		>
			<ResponsiveContainer
				width="100%"
				height={300}
			>
				<AreaChart data={checks?.slice()}>
					<CartesianGrid
						stroke={theme.palette.divider}
						strokeWidth={1}
						strokeOpacity={1}
						fill="transparent"
						vertical={false}
					/>
					<defs>
						<linearGradient
							id="colorUv"
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<stop
								offset="0%"
								stopColor={theme.palette.primary.main}
								stopOpacity={0.8}
							/>
							<stop
								offset="100%"
								stopColor={theme.palette.primary.light}
								stopOpacity={0}
							/>
						</linearGradient>
						{PHASE_KEYS.map((key) => (
							<linearGradient
								key={key}
								id={`phaseGradient-${key}`}
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="0%"
									stopColor={theme.palette.chart.phases[PHASE_COLOR_KEYS[key]]}
									stopOpacity={0.8}
								/>
								<stop
									offset="100%"
									stopColor={theme.palette.chart.phases[PHASE_COLOR_KEYS[key]]}
									stopOpacity={0.2}
								/>
							</linearGradient>
						))}
					</defs>
					<YAxis
						hide
						// scale="sqrt"
						domain={[0, yMax ?? "auto"]}
						allowDataOverflow
					/>
					<XAxis
						axisLine={false}
						tickLine={false}
						dataKey="bucketDate"
						tick={(props) => (
							<XTick
								{...props}
								range={range}
							/>
						)}
					/>

					{showTimingPhases ? (
						<Tooltip
							content={(props) => (
								<TimingPhasesToolTip
									{...props}
									range={range}
									theme={theme}
									uiTimezone={uiTimezone}
								/>
							)}
						/>
					) : (
						<Tooltip
							content={(props) => (
								<ResponseTimeToolTip
									{...props}
									range={range}
									theme={theme}
									uiTimezone={uiTimezone}
								/>
							)}
						/>
					)}
					{!showTimingPhases && (
						<Area
							type="monotone"
							dataKey="avgResponseTime"
							stroke={theme.palette.primary.main}
							fill="url(#colorUv)"
						/>
					)}
					{hasTimingPhases &&
						showTimingPhases &&
						PHASE_KEYS.map((key) => {
							const dimmed = hoveredPhase !== null && hoveredPhase !== key;
							return (
								<Area
									key={key}
									type="monotone"
									stackId={1}
									dataKey={key}
									stroke={theme.palette.chart.phases[PHASE_COLOR_KEYS[key]]}
									fill={`url(#phaseGradient-${key})`}
									fillOpacity={dimmed ? 0.2 : undefined}
									strokeOpacity={dimmed ? 0.2 : undefined}
								/>
							);
						})}
				</AreaChart>
			</ResponsiveContainer>
			<Stack
				justifyContent={"center"}
				gap={LAYOUT.XS}
				direction={"row"}
				flexWrap={"wrap"}
			>
				{showTimingPhases ? (
					PHASE_KEYS.map((key) => {
						return (
							<Stack
								direction="row"
								alignItems="center"
								gap={SPACING.LG}
								key={key}
								onMouseEnter={() => setHoveredPhase(key)}
								onMouseLeave={() => setHoveredPhase(null)}
							>
								<Dot
									color={theme.palette.chart.phases[PHASE_COLOR_KEYS[key]]}
									size="lg"
								/>
								<Typography lineHeight={1}>{t(PHASE_LABEL_KEYS[key])}</Typography>
							</Stack>
						);
					})
				) : (
					<Stack
						direction="row"
						alignItems="center"
						gap={SPACING.LG}
						onMouseEnter={() => setHoveredPhase("avgResponseTime")}
						onMouseLeave={() => setHoveredPhase(null)}
					>
						<Dot
							color={theme.palette.primary.main}
							size="lg"
						/>
						<Typography lineHeight={1}>
							{t("common.charts.labels.totalResponseTime")}
						</Typography>
					</Stack>
				)}
			</Stack>
		</BaseChart>
	);
};
