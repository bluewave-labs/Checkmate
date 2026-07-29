import type { GroupedUptimeCheck } from "@/Types/Check";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { Theme } from "@mui/material/styles";
import type { RootState } from "@/Types/state";
import { Clock } from "lucide-react";
import prettyMilliseconds from "pretty-ms";

import Stack from "@mui/material/Stack";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	YAxis,
	XAxis,
	Text,
	Tooltip,
} from "recharts";
import { BaseBox, BaseChart, Dot } from "@/Components/design-elements";
import Typography from "@mui/material/Typography";

import {
	formatDateWithTz,
	tickDateFormatLookup,
	tooltipDateFormatLookup,
} from "@/Utils/TimeUtils";
import { useSelector } from "react-redux";
import { useMemo } from "react";
import { useTheme } from "@mui/material";
import { SPACING } from "@/Utils/Theme/constants";
import { computeYAxisCap } from "@/Components/monitors/charts/ChartUtils";

export const PHASE_KEYS = [
	"avgDns",
	"avgTcp",
	"avgTls",
	"avgRequest",
	"avgFirstByte",
	"avgDownload",
] as const;

const PHASE_COLOR_KEYS = {
	avgDns: "dns",
	avgTcp: "tcp",
	avgTls: "tls",
	avgRequest: "request",
	avgFirstByte: "firstByte",
	avgDownload: "download",
} as const;

const PHASE_LABELS: Record<(typeof PHASE_KEYS)[number], string> = {
	avgDns: "DNS",
	avgTcp: "TCP",
	avgTls: "TLS",
	avgRequest: "Request",
	avgFirstByte: "First byte",
	avgDownload: "Download",
};

type TimingPhaseToolTipProps = TooltipProps<ValueType, NameType> & {
	range: string;
	theme: Theme;
	uiTimezone: string;
};

type XTickProps = {
	x: number;
	y: number;
	payload: { value: string };
	range: string;
};

const TimingPhasesToolTip = ({
	active,
	payload,
	range,
	theme,
	uiTimezone,
}: TimingPhaseToolTipProps) => {
	if (!active || !payload?.length) return null;
	const bucket = payload[0].payload as GroupedUptimeCheck;
	const total = PHASE_KEYS.reduce((sum, key) => sum + bucket[key], 0);
	const format = tooltipDateFormatLookup(range);
	return (
		<BaseBox sx={{ py: theme.spacing(2), px: theme.spacing(4) }}>
			<Typography>{formatDateWithTz(bucket.bucketDate, format, uiTimezone)}</Typography>
			<Typography>Total: {prettyMilliseconds(total)}</Typography>
			{PHASE_KEYS.map((key) => (
				<Stack
					alignItems={"center"}
					direction="row"
					key={key}
					gap={SPACING.LG}
				>
					<Dot
						size={"12px"}
						color={theme.palette.chart.phases[PHASE_COLOR_KEYS[key]]}
					/>
					<Typography>
						{PHASE_LABELS[key]}:{" "}
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

export const XTick = ({ x, y, payload, range }: XTickProps) => {
	const format = tickDateFormatLookup(range);
	const theme = useTheme();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);
	return (
		<Text
			x={x}
			y={y + 10}
			textAnchor="middle"
			fill={theme.palette.text.secondary}
			fontSize={11}
			fontWeight={400}
		>
			{formatDateWithTz(payload?.value, format, uiTimezone)}
		</Text>
	);
};

export const HistogramDetailsStacked = ({
	checks = [],
	range,
}: {
	checks: GroupedUptimeCheck[];
	range: string;
}) => {
	const theme = useTheme();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);

	// Cap the y domain at 2x the p95 of bucket totals, so typical stacks sit
	// around mid-height with headroom above
	const yMax = useMemo(() => {
		const totals = checks.map((check) =>
			PHASE_KEYS.reduce((sum, key) => sum + check[key], 0)
		);
		return computeYAxisCap(totals);
	}, [checks]);

	return (
		<BaseChart
			icon={
				<Clock
					size={20}
					strokeWidth={1.5}
				/>
			}
			title="Timing phases"
		>
			<ResponsiveContainer
				width="100%"
				height={300}
			>
				<AreaChart data={checks.slice()}>
					<CartesianGrid
						stroke={theme.palette.divider}
						strokeWidth={1}
						strokeOpacity={1}
						fill="transparent"
						vertical={false}
					/>
					<defs>
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
					{PHASE_KEYS.map((key) => (
						<Area
							key={key}
							type="monotone"
							stackId={1}
							dataKey={key}
							stroke={theme.palette.chart.phases[PHASE_COLOR_KEYS[key]]}
							fill={`url(#phaseGradient-${key})`}
						/>
					))}
				</AreaChart>
			</ResponsiveContainer>
		</BaseChart>
	);
};
