import { BaseBox, BaseChart } from "@/Components/design-elements";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { XTick } from "@/Components/monitors/charts/XTick";

import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { DateRange } from "@/Types/Query";

import { useTheme } from "@mui/material";
import { Fragment, useId } from "react";
import { useFormatDate } from "@/Hooks/useFormatDate";

import { createGradient } from "@/Components/monitors/charts/ChartUtils";
import { PLACEHOLDER } from "@/Utils/FormatUtils";
import { tooltipBucketDate, tooltipDateFormatLookup } from "@/Utils/TimeUtils";
import { LAYOUT } from "@/Utils/Theme/constants";

const CHART_HEIGHT = 200;

export interface MetricsSeries {
	dataKey: string;
	label: string;
}

type MetricsFormatter = (value: number) => string;

const formatTooltipValue = (
	value: ValueType | undefined,
	formatter: MetricsFormatter
) => {
	if (typeof value !== "number") {
		return PLACEHOLDER;
	}
	return formatter(value);
};

type MetricsTooltipProps = TooltipProps<ValueType, NameType> & {
	range: DateRange;
	valueFormatter: MetricsFormatter;
};

const MetricsTooltip = ({
	active,
	payload,
	range,
	valueFormatter,
}: MetricsTooltipProps) => {
	const theme = useTheme();
	const formatDate = useFormatDate();
	if (!active || !payload || payload.length === 0) {
		return null;
	}
	const bucketDate = payload[0].payload?.bucketDate;

	return (
		<BaseBox sx={{ py: theme.spacing(LAYOUT.XXS), px: theme.spacing(LAYOUT.XS) }}>
			<Typography>
				{formatDate(tooltipBucketDate(bucketDate, range), tooltipDateFormatLookup(range))}
			</Typography>
			{payload.map((entry) => (
				<Stack
					key={entry.dataKey}
					direction="row"
					justifyContent="space-between"
					gap={theme.spacing(LAYOUT.MD)}
				>
					<Typography color={entry.color}>{entry.name}</Typography>
					<Typography>{formatTooltipValue(entry.value, valueFormatter)}</Typography>
				</Stack>
			))}
		</BaseBox>
	);
};

interface HistogramMetricsProps {
	title: string;
	data: object[];
	series: MetricsSeries[];
	range: DateRange;
	formatter: MetricsFormatter;
	yDomain?: [number, number];
}

export const HistogramMetrics = ({
	title,
	data,
	series,
	range,
	formatter,
	yDomain,
}: HistogramMetricsProps) => {
	const theme = useTheme();
	const uniqueId = useId();
	const colors = theme.palette.chart.series;

	return (
		<BaseChart
			icon={null}
			title={title}
		>
			<ResponsiveContainer
				width="100%"
				height={CHART_HEIGHT}
			>
				<AreaChart data={data}>
					<XAxis
						dataKey="bucketDate"
						tick={(props) => (
							<XTick
								{...props}
								range={range}
							/>
						)}
					/>
					<YAxis
						domain={yDomain}
						tickFormatter={formatter}
					/>
					<CartesianGrid
						stroke={theme.palette.divider}
						strokeWidth={1}
						strokeOpacity={1}
						fill="transparent"
						vertical={false}
					/>
					<Tooltip
						content={(props) => (
							<MetricsTooltip
								{...props}
								range={range}
								valueFormatter={formatter}
							/>
						)}
					/>
					{series.map((item, index) => {
						const gradientId = `gradient-${uniqueId}-${index}`;
						const color = colors[index % colors.length];
						return (
							<Fragment key={item.dataKey}>
								{createGradient({
									id: gradientId,
									startColor: color,
									endColor: "transparent",
								})}
								<Area
									type="monotone"
									dataKey={item.dataKey}
									name={item.label}
									stroke={color}
									fill={`url(#${gradientId})`}
								/>
							</Fragment>
						);
					})}
				</AreaChart>
			</ResponsiveContainer>
		</BaseChart>
	);
};
