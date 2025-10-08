import { BaseChart } from "./HistogramStatus";
import { BaseBox } from "../DesignElements";
import ResponseTimeIcon from "@/assets/icons/response-time-icon.svg?react";
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

import {
	formatDateWithTz,
	tickDateFormatLookup,
	tooltipDateFormatLookup,
} from "@/Utils/TimeUtils";
import { useTheme } from "@mui/material/styles";
import type { GroupedCheck } from "@/Types/Check";
import { useSelector } from "react-redux";

type XTickProps = {
	x: number;
	y: number;
	payload: { value: any };
	range: string;
};

const XTick: React.FC<XTickProps> = ({ x, y, payload, range }) => {
	const format = tickDateFormatLookup(range);
	const theme = useTheme();
	const uiTimezone = useSelector((state: any) => state.ui.timezone);
	return (
		<Text
			x={x}
			y={y + 10}
			textAnchor="middle"
			fill={theme.palette.primary.contrastTextTertiary}
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
	label?: string;
	range: string;
	theme: any;
	uiTimezone: string;
};

const ResponseTimeToolTip: React.FC<ResponseTimeToolTipProps> = ({
	active,
	payload,
	label,
	range,
	theme,
	uiTimezone,
}) => {
	if (!label) return null;
	if (!payload) return null;
	if (!active) return null;

	const format = tooltipDateFormatLookup(range);
	const responseTime = Math.floor(payload?.[0]?.value || 0);
	return (
		<BaseBox sx={{ py: theme.spacing(2), px: theme.spacing(4) }}>
			<Typography>{formatDateWithTz(label, format, uiTimezone)}</Typography>
			<Typography>Response time: {responseTime} ms</Typography>
		</BaseBox>
	);
};

export const ChartResponseTime = ({
	checks,
	range,
}: {
	checks: GroupedCheck[];
	range: string;
}) => {
	const theme = useTheme();
	const uiTimezone = useSelector((state: any) => state.ui.timezone);

	return (
		<BaseChart
			icon={<ResponseTimeIcon />}
			title="Response times"
		>
			<ResponsiveContainer
				width="100%"
				height={300}
			>
				<AreaChart data={checks?.slice().reverse()}>
					<CartesianGrid
						stroke={theme.palette.primary.lowContrast}
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
								stopColor={theme.palette.accent.main}
								stopOpacity={0.8}
							/>
							<stop
								offset="100%"
								stopColor={theme.palette.accent.light}
								stopOpacity={0}
							/>
						</linearGradient>
					</defs>
					<XAxis
						axisLine={false}
						tickLine={false}
						dataKey="_id"
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
						stroke={theme.palette.accent.main}
						fill="url(#colorUv)"
					/>
				</AreaChart>
			</ResponsiveContainer>
		</BaseChart>
	);
};
