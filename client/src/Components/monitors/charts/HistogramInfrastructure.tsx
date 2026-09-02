import { BaseChart } from "@/Components/design-elements";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	ResponsiveContainer,
} from "recharts";
import { Fragment, useId } from "react";
import { XTick } from "@/Components/monitors/charts/XTick";

import { useTheme } from "@mui/material/styles";
import type { HardwareCheckStats } from "@/Types/Monitor";
import { AREA_COLORS, createGradient } from "@/Components/monitors/charts/ChartUtils";

export const HistogramInfrastructure = ({
	dateRange,
	title,
	type,
	idx: _idx,
	checks,
	xKey,
	yDomain,
	dataKeys,
	gradient = false,
	gradientDirection = "vertical",
	gradientStartColor,
	gradientEndColor,
	strokeColor,
	fillColor,
	yAxisFormatter,
}: {
	dateRange: string;
	title: string;
	type: string;
	idx: number | null;
	checks: HardwareCheckStats[];
	xKey: string;
	yDomain?: number[];
	dataKeys: string[];
	gradient?: boolean;
	gradientDirection?: "vertical" | "horizontal";
	gradientStartColor?: string;
	gradientEndColor?: string;
	strokeColor: string;
	fillColor?: string;
	yAxisFormatter?: (value: number) => string;
}) => {
	const theme = useTheme();
	const uniqueId = useId();
	const data = checks;

	let avgTemps: { bucketDate: string; avg_temp: number | null }[] = [];
	let tempYDomain: number[] = [];
	if (type === "temp") {
		avgTemps = data.map((check) => {
			const temps = check.avgTemperature || [];
			if (temps.length === 0) return { bucketDate: check.bucketDate, avg_temp: null };
			const totalTemp = temps.reduce((sum, temp) => sum + (temp || 0), 0);
			const avgTemp = totalTemp / temps.length;
			return { bucketDate: check.bucketDate, avg_temp: avgTemp };
		});

		const maxTemp: number = avgTemps.reduce((max, item) => {
			return item.avg_temp && item.avg_temp > max ? item.avg_temp : max;
		}, 0);

		tempYDomain = [0, Math.ceil((maxTemp * 1.3) / 10) * 10];
	}

	return (
		<BaseChart
			icon={null}
			title={title}
		>
			<ResponsiveContainer
				width="100%"
				height={200}
			>
				<AreaChart data={type === "temp" ? avgTemps : data}>
					<XAxis
						dataKey={xKey}
						tick={(props) => (
							<XTick
								{...props}
								range={dateRange}
							/>
						)}
					/>
					<YAxis
						domain={type === "temp" ? tempYDomain : yDomain}
						tickFormatter={yAxisFormatter}
					/>

					<CartesianGrid
						stroke={theme.palette.divider}
						strokeWidth={1}
						strokeOpacity={1}
						fill="transparent"
						vertical={false}
					/>
					{dataKeys?.map((dataKey, index) => {
						const gradientId = `gradient-${uniqueId}-${index}`;
						return (
							<Fragment key={`${dataKey}-${index}`}>
								{gradient === true &&
									createGradient({
										id: gradientId,
										startColor: gradientStartColor || AREA_COLORS[index],
										endColor: gradientEndColor || "transparent",
										direction: gradientDirection,
									})}
								<Area
									key={dataKey}
									type="monotone"
									dataKey={dataKey}
									stroke={strokeColor || AREA_COLORS[index]}
									fill={gradient === true ? `url(#${gradientId})` : fillColor}
								/>
							</Fragment>
						);
					})}
				</AreaChart>
			</ResponsiveContainer>
		</BaseChart>
	);
};
