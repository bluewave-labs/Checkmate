import PropTypes from "prop-types";
import { useTheme } from "@mui/material";
import { ResponsiveContainer, RadialBarChart, RadialBar, Cell } from "recharts";

const ResponseGaugeChart = ({ avgResponseTime }) => {
	const theme = useTheme();

	let max = 1000; // max ms

	const data = [
		{ response: max, fill: "transparent", background: false },
		{ response: avgResponseTime, background: true },
	];
	let responseTime = Math.floor(avgResponseTime);
	let responseProps =
		responseTime <= 200
			? {
					category: "Excellent",
					main: theme.palette.success.main,
					bg: theme.palette.success.contrastText,
				}
			: responseTime <= 500
				? {
						category: "Fair",
						main: theme.palette.success.main,
						bg: theme.palette.success.contrastText,
					}
				: responseTime <= 600
					? {
							category: "Acceptable",
							main: theme.palette.warning.main,
							bg: theme.palette.warning.dark,
						}
					: {
							category: "Poor",
							main: theme.palette.error.main,
							bg: theme.palette.error.light,
						};

	return (
		<ResponsiveContainer
			width="100%"
			minWidth={210}
			height={155}
		>
			<RadialBarChart
				width="100%"
				height="100%"
				cy="89%"
				data={data}
				startAngle={180}
				endAngle={0}
				innerRadius={100}
				outerRadius={150}
			>
				<text
					x={0}
					y="100%"
					dx="5%"
					dy={-2}
					textAnchor="start"
					fontSize={11}
				>
					low
				</text>
				<text
					x="100%"
					y="100%"
					dx="-3%"
					dy={-2}
					textAnchor="end"
					fontSize={11}
				>
					high
				</text>
				<text
					x="50%"
					y="45%"
					textAnchor="middle"
					dominantBaseline="middle"
					fontSize={18}
					fontWeight={400}
				>
					{responseProps.category}
				</text>
				<text
					x="50%"
					y="55%"
					textAnchor="middle"
					dominantBaseline="hanging"
					fontSize={25}
				>
					<tspan fontWeight={600}>{responseTime}</tspan> <tspan opacity={0.8}>ms</tspan>
				</text>
				<RadialBar
					background={{ fill: responseProps.bg }}
					clockWise
					dataKey="response"
					stroke="none"
				>
					<Cell
						fill="transparent"
						background={false}
						barSize={0}
					/>
					<Cell fill={responseProps.main} />
				</RadialBar>
			</RadialBarChart>
		</ResponsiveContainer>
	);
};

ResponseGaugeChart.propTypes = {
	avgResponseTime: PropTypes.number.isRequired,
};

export default ResponseGaugeChart;
