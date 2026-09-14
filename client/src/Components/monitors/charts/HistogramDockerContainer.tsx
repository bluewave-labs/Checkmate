import { BaseChart, BaseBox } from "@/Components/design-elements";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import Typography from "@mui/material/Typography";

// Types
import type { DockerContainerStats } from "@/Types/Monitor";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { Theme } from "@mui/material/styles";
import type { RootState } from "@/Types/state";

// Hooks
import { useTheme } from "@mui/material";
import { Fragment, useId } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

// Utils
import { createGradient } from "@/Components/monitors/charts/ChartUtils";
import { tooltipDateFormatLookup, formatDateWithTz } from "@/Utils/TimeUtils";
import type { DateRange } from "@/Types/Query";

type DockerHistogramToolTipProps = TooltipProps<ValueType, NameType> & {
	dataKey: string;
	range: string;
	theme: Theme;
	uiTimezone: string;
	valueFormatter: (value: number) => string;
	labelKey: string;
};

const DockerHistogramToolTip = ({
	dataKey,
	active,
	payload,
	range,
	theme,
	uiTimezone,
	valueFormatter,
	labelKey,
}: DockerHistogramToolTipProps) => {
	const { t } = useTranslation();
	if (!payload) return null;
	if (!active) return null;
	const format = tooltipDateFormatLookup(range);
	const ts = payload[0].payload?._id ?? null;
	const dataPoint = payload[0].payload?.[dataKey] ?? null;

	return (
		<BaseBox sx={{ py: theme.spacing(2), px: theme.spacing(4) }}>
			<Typography>{formatDateWithTz(ts, format, uiTimezone)}</Typography>
			<Typography>{t(labelKey, { value: valueFormatter(dataPoint) })}</Typography>
		</BaseBox>
	);
};
interface HistogramDockerContainerProps {
	title: string;
	rightTitle: string;
	stats: DockerContainerStats;
	dataKey: string;
	strokeColor: string;
	gradientStartColor: string;
	range: DateRange;
	formatter: (value: number) => string;
	labelKey: string;
}

export const HistogramDockerContainer = ({
	title,
	rightTitle,
	stats,
	dataKey,
	strokeColor,
	gradientStartColor,
	range,
	formatter,
	labelKey,
}: HistogramDockerContainerProps) => {
	const uniqueId = useId();
	const theme = useTheme();
	const gradientId = `gradient-${uniqueId}`;
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);
	return (
		<BaseChart
			icon="null"
			title={title}
			rightTitle={rightTitle}
		>
			<ResponsiveContainer
				width="100%"
				height={200}
			>
				<AreaChart data={stats.aggregate}>
					<CartesianGrid
						strokeWidth={1}
						stroke={theme.palette.divider}
						strokeOpacity={1}
						fill="transparent"
						vertical={false}
					/>
					<Fragment>
						{createGradient({
							id: gradientId,
							startColor: gradientStartColor,
							endColor: "transparent",
							direction: "vertical",
						})}
						<Tooltip
							content={(props) => (
								<DockerHistogramToolTip
									{...props}
									range={range}
									theme={theme}
									uiTimezone={uiTimezone}
									dataKey={dataKey}
									valueFormatter={formatter}
									labelKey={labelKey}
								/>
							)}
						/>
						<Area
							dataKey={dataKey}
							type="monotone"
							stroke={strokeColor}
							fill={`url(#${gradientId})`}
						/>
					</Fragment>
				</AreaChart>
			</ResponsiveContainer>
		</BaseChart>
	);
};
