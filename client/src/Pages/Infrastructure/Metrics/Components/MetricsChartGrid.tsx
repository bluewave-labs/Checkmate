import Grid from "@mui/material/Grid";
import {
	HistogramMetrics,
	type MetricsSeries,
} from "@/Components/monitors/charts/HistogramMetrics";

import { useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { DateRange } from "@/Types/Query";
import { LAYOUT } from "@/Utils/Theme/constants";

export interface MetricsChartConfig {
	key: string;
	title: string;
	series: MetricsSeries[];
	formatter: (value: number) => string;
	yDomain?: [number, number];
}

interface MetricsChartConfigProps {
	configs: MetricsChartConfig[];
	data: object[];
	dateRange: DateRange;
}

export const MetricsChartGrid = ({
	configs,
	data,
	dateRange,
}: MetricsChartConfigProps) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	return (
		<Grid
			container
			spacing={theme.spacing(LAYOUT.MD)}
		>
			{configs.map((config) => (
				<Grid
					size={isSmall ? 12 : 6}
					key={config.key}
				>
					<HistogramMetrics
						title={config.title}
						data={data}
						series={config.series}
						range={dateRange}
						formatter={config.formatter}
						yDomain={config.yDomain}
					/>
				</Grid>
			))}
		</Grid>
	);
};
