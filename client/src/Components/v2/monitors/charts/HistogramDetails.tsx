import { BaseChart, BaseBox } from "@/Components/v2/design-elements";
import { Clock } from "lucide-react";
import {
	AreaChart,
	Area,
	XAxis,
	Tooltip,
	CartesianGrid,
	ResponsiveContainer,
	Text,
} from "recharts";
import Typography from "@mui/material/Typography";

import { useSelector } from "react-redux";
import {
	formatDateWithTz,
	tickDateFormatLookup,
	tooltipDateFormatLookup,
} from "@/Utils/TimeUtils";
import { useTheme } from "@mui/material/styles";
import type { GroupedCheck } from "@/Types/Check";
import type { RootState } from "@/Types/state";

type XTickProps = {
	x: number;
	y: number;
	payload: { value: any };
	range: string;
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

type ResponseTimeToolTipProps = {
	active?: boolean | undefined;
	payload?: any[];
	label?: string | number;
	range: string;
	theme: any;
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
	if (!label) return null;
	if (!payload) return null;
	if (!active) return null;

	const format = tooltipDateFormatLookup(range);
	const responseTime = Math.floor(payload?.[0]?.payload?.avgResponseTime || 0);
	return (
		<BaseBox sx={{ py: theme.spacing(2), px: theme.spacing(4) }}>
			<Typography>{formatDateWithTz(String(label), format, uiTimezone)}</Typography>
			<Typography>Response time: {responseTime} ms</Typography>
		</BaseBox>
	);
};

export const HistogramDetails = ({
	checks,
	range,
}: {
	checks: GroupedCheck[];
	range: string;
}) => {
	const theme = useTheme();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);
	return (
		<BaseChart
			icon={
				<Clock
					size={20}
					strokeWidth={1.5}
				/>
			}
			title="Response times"
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
					</defs>
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
							<ResponseTimeToolTip
								{...props}
								range={range}
								theme={theme}
								uiTimezone={uiTimezone}
							/>
						)}
					/>
					<Area
						type="monotone"
						dataKey="avgResponseTime"
						stroke={theme.palette.primary.main}
						fill="url(#colorUv)"
					/>
				</AreaChart>
			</ResponsiveContainer>
		</BaseChart>
	);
};
