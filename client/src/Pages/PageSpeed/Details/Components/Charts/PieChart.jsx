import PropTypes from "prop-types";
import { PieChart as MuiPieChart } from "@mui/x-charts/PieChart";
import { useDrawingArea } from "@mui/x-charts";
import { useState } from "react";
import { useTheme } from "@emotion/react";
import { Box } from "@mui/material";

/**
 * Renders a centered label within a pie chart.
 *
 * @param {Object} props
 * @param {string | number} props.value - The value to display in the label.
 * @param {string} props.color - The color of the text.
 * @returns {JSX.Element}
 */
const PieCenterLabel = ({ value, color, setExpand }) => {
	const { width, height } = useDrawingArea();
	return (
		<g
			transform={`translate(${width / 2}, ${height / 2})`}
			onMouseEnter={() => setExpand(true)}
		>
			<circle
				cx={0}
				cy={0}
				r={width / 4}
				fill="transparent"
			/>
			<text
				className="pie-label"
				style={{
					fill: color,
					fontSize: 48,
					textAnchor: "middle",
					dominantBaseline: "central",
					userSelect: "none",
				}}
			>
				{value}
			</text>
		</g>
	);
};

PieCenterLabel.propTypes = {
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	color: PropTypes.string,
	setExpand: PropTypes.func,
};

/**
 * A component that renders a label on a pie chart slice.
 * The label is positioned relative to the center of the pie chart and is optionally highlighted.
 *
 * @param {Object} props
 * @param {number} props.value - The value to display inside the pie slice.
 * @param {number} props.startAngle - The starting angle of the pie slice in degrees.
 * @param {number} props.endAngle - The ending angle of the pie slice in degrees.
 * @param {string} props.color - The color of the label text when highlighted.
 * @param {boolean} props.highlighted - Determines if the label should be highlighted or not.
 * @returns {JSX.Element}
 */
const PieValueLabel = ({ value, startAngle, endAngle, color, highlighted }) => {
	const { width, height } = useDrawingArea();

	// Compute the midpoint angle in radians
	const angle = (((startAngle + endAngle) / 2) * Math.PI) / 180;
	const radius = height / 4; // length from center of the circle to where the text is positioned

	// Calculate x and y positions
	const x = Math.sin(angle) * radius;
	const y = -Math.cos(angle) * radius;

	return (
		<g transform={`translate(${width / 2}, ${height / 2})`}>
			<text
				className="pie-value-label"
				x={x}
				y={y}
				style={{
					fill: highlighted ? color : "rgba(0,0,0,0)",
					fontSize: 12,
					textAnchor: "middle",
					dominantBaseline: "central",
					userSelect: "none",
					pointerEvents: "none",
				}}
			>
				+{value}
			</text>
		</g>
	);
};

// Validate props using PropTypes
PieValueLabel.propTypes = {
	value: PropTypes.number.isRequired,
	startAngle: PropTypes.number.isRequired,
	endAngle: PropTypes.number.isRequired,
	color: PropTypes.string.isRequired,
	highlighted: PropTypes.bool.isRequired,
};

/**
 * Weight constants for different performance metrics.
 * @type {Object}
 */
const weights = {
	fcp: 10,
	si: 10,
	lcp: 25,
	tbt: 30,
	cls: 25,
};

const PieChart = ({ audits }) => {
	const theme = useTheme();
	const [highlightedItem, setHighLightedItem] = useState(null);
	const [expand, setExpand] = useState(false);

	/**
	 * Retrieves color properties based on the performance value.
	 *
	 * @param {number} value - The performance score used to determine the color properties.
	 * @returns {{stroke: string, strokeBg: string, text: string, bg: string}} The color properties for the given performance value.
	 */
	const getColors = (value) => {
		if (value >= 90 && value <= 100)
			return {
				stroke: theme.palette.success.main,
				strokeBg: theme.palette.success.lowContrast,
				text: theme.palette.success.contrastText,
				bg: theme.palette.success.lowContrast,
			};
		else if (value >= 50 && value < 90)
			return {
				stroke: theme.palette.warning.main,
				strokeBg: theme.palette.warning.lowContrast,
				text: theme.palette.warning.contrastText,
				bg: theme.palette.warning.lowContrast,
			};
		else if (value >= 0 && value < 50)
			return {
				stroke: theme.palette.error.contrastText,
				strokeBg: theme.palette.error.lowContrast,
				text: theme.palette.error.contrastText,
				bg: theme.palette.error.lowContrast,
			};
		return {
			stroke: theme.palette.tertiary.contrastText,
			strokeBg: theme.palette.tertiary.contrastText,
			text: theme.palette.tertiary.contrastText,
			bg: theme.palette.tertiary.main,
		};
	};

	/**
	 * Calculates and formats the data needed for rendering a pie chart based on audit scores and weights.
	 * This function generates properties for each pie slice, including angles, radii, and colors.
	 * It also calculates performance based on the weighted values.
	 *
	 * @returns {Array<Object>} An array of objects, each representing the properties for a slice of the pie chart.
	 * @returns {number} performance - A variable updated with the rounded sum of weighted values.
	 */
	let performance = 0;
	const getPieData = (audits) => {
		if (typeof audits === "undefined") return undefined;

		let data = [];
		let startAngle = 0;
		const padding = 3; // padding between arcs
		const max = 360 - padding * (Object.keys(audits).length - 1); // _id is a child of audits

		Object.keys(audits).forEach((key) => {
			if (audits[key].score) {
				let value = audits[key].score * weights[key];
				let endAngle = startAngle + (weights[key] * max) / 100;

				let theme = getColors(audits[key].score * 100);
				data.push({
					id: key,
					data: [
						{
							value: value,
							color: theme.stroke,
							label: key.toUpperCase(),
						},
						{
							value: weights[key] - value,
							color: theme.strokeBg,
							label: "",
						},
					],
					arcLabel: (item) => `${item.label}`,
					arcLabelRadius: 95,
					startAngle: startAngle,
					endAngle: endAngle,
					innerRadius: 73,
					outerRadius: 80,
					cornerRadius: 2,
					highlightScope: { faded: "global", highlighted: "series" },
					faded: {
						innerRadius: 73,
						outerRadius: 80,
						additionalRadius: -20,
						arcLabelRadius: 5,
					},
					cx: pieSize.width / 2,
				});

				performance += Math.floor(value);
				startAngle = endAngle + padding;
			}
		});

		return data;
	};

	const pieSize = { width: 230, height: 230 };
	const pieData = getPieData(audits);
	const colorMap = getColors(performance);

	return (
		<Box
			onMouseLeave={() => setExpand(false)}
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				width: "100%",
			}}
		>
			{expand ? (
				<MuiPieChart
					series={[
						{
							data: [
								{
									value: 100,
									color: colorMap.bg,
								},
							],
							outerRadius: 77,
							cx: pieSize.width / 2,
						},
						...pieData,
					]}
					width={pieSize.width}
					height={pieSize.height}
					margin={{ left: 0, top: 0, right: 0, bottom: 0 }}
					onHighlightChange={setHighLightedItem}
					slotProps={{
						legend: { hidden: true },
					}}
					tooltip={{ trigger: "none" }}
					sx={{
						"&:has(.MuiPieArcLabel-faded) .pie-label": {
							fill: "rgba(0,0,0,0) !important",
						},
					}}
				>
					<PieCenterLabel
						value={performance}
						color={colorMap.text}
						setExpand={setExpand}
					/>
					{pieData?.map((pie) => (
						<PieValueLabel
							key={pie.id}
							value={Math.round(pie.data[0].value * 10) / 10}
							startAngle={pie.startAngle}
							endAngle={pie.endAngle}
							color={pie.data[0].color}
							highlighted={highlightedItem?.seriesId === pie.id}
						/>
					))}
				</MuiPieChart>
			) : (
				<MuiPieChart
					series={[
						{
							data: [
								{
									value: 100,
									color: colorMap.bg,
								},
							],
							outerRadius: 77,
							cx: pieSize.width / 2,
						},
						{
							data: [
								{
									value: performance,
									color: colorMap.stroke,
								},
							],
							innerRadius: 73,
							outerRadius: 80,
							paddingAngle: 5,
							cornerRadius: 2,
							startAngle: 0,
							endAngle: (performance / 100) * 360,
							cx: pieSize.width / 2,
						},
					]}
					width={pieSize.width}
					height={pieSize.height}
					margin={{ left: 0, top: 0, right: 0, bottom: 0 }}
					tooltip={{ trigger: "none" }}
				>
					<PieCenterLabel
						value={performance}
						color={colorMap.text}
						setExpand={setExpand}
					/>
				</MuiPieChart>
			)}
		</Box>
	);
};

PieChart.propTypes = {
	audits: PropTypes.object,
};

export default PieChart;
