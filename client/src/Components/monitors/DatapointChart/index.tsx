import { Box, Stack, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { LAYOUT } from "@/Utils/Theme/constants";

interface DatapointChartProps {
	name: string;
	unit?: string;
	data: Array<{ t: string; v: number }>;
}

// DatapointChart renders a single time-series datapoint as a smooth line
// chart with hover tooltips. The component is intentionally thin so each
// chart instance gets its own ResponsiveContainer and its own scale.
const DatapointChart = ({ name, unit, data }: DatapointChartProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	if (data.length === 0) {
		return (
			<Box
				p={theme.spacing(LAYOUT.MD)}
				borderRadius={theme.shape.borderRadius}
				bgcolor={theme.palette.background.paper}
			>
				<Typography
					variant="body2"
					color={theme.palette.text.secondary}
				>
					{t(
						"pages.scriptMonitor.details.datapointEmpty",
						"No data points yet for {{name}}",
						{
							name,
						}
					)}
				</Typography>
			</Box>
		);
	}

	const formatTime = (value: string): string => {
		const d = new Date(value);
		return Number.isNaN(d.getTime()) ? value : d.toLocaleTimeString();
	};

	return (
		<Box
			p={theme.spacing(LAYOUT.MD)}
			borderRadius={theme.shape.borderRadius}
			bgcolor={theme.palette.background.paper}
		>
			<Stack
				direction="row"
				justifyContent="space-between"
				mb={theme.spacing(LAYOUT.XS)}
			>
				<Typography
					variant="subtitle2"
					color={theme.palette.text.primary}
				>
					{name}
				</Typography>
				{unit && (
					<Typography
						variant="body2"
						color={theme.palette.text.secondary}
					>
						{unit}
					</Typography>
				)}
			</Stack>
			<Box
				height={160}
				width="100%"
			>
				<ResponsiveContainer>
					<LineChart data={data}>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke={theme.palette.divider}
						/>
						<XAxis
							dataKey="t"
							tickFormatter={formatTime}
							tick={{ fontSize: 12 }}
						/>
						<YAxis tick={{ fontSize: 12 }} />
						<Tooltip
							labelFormatter={(label: string) => formatTime(label)}
							formatter={(value: number) => [`${value}${unit ? ` ${unit}` : ""}`, name]}
						/>
						<Line
							type="monotone"
							dataKey="v"
							stroke={theme.palette.primary.main}
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</Box>
		</Box>
	);
};

export default DatapointChart;
