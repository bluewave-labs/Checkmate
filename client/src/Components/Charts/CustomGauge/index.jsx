import { useTheme } from "@emotion/react";
import { useEffect, useState, useMemo } from "react";
import Stack from "@mui/material/Stack";
import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import "./index.css";
import CircularProgress from "@mui/material/CircularProgress";

const MINIMUM_VALUE = 0;
const MAXIMUM_VALUE = 100;

/**
 * A Performant SVG based circular gauge
 *
 * @component
 * @param {Object} props - Component properties
 * @param {number} [props.progress=0] - Progress percentage (0-100)
 * @param {number} [props.radius=60] - Radius of the gauge circle
 * @param {number} [props.strokeWidth=15] - Width of the gauge stroke
 * @param {number} [props.precision=1] - Precision of the progress percentage
 * @param {string} [props.unit="%"] - Unit of progress
 *
 * @example
 * <CustomGauge
 *   progress={75}
 *   radius={50}
 *   strokeWidth={10}
 * />
 *
 * @returns {React.ReactElement} Rendered CustomGauge component
 */
const CustomGauge = ({
	isLoading = false,
	progress = 0,
	radius = 70,
	strokeWidth = 15,
	precision = 1,
	unit = "%",
}) => {
	const theme = useTheme();
	// Calculate the length of the stroke for the circle
	const { circumference, totalSize, strokeLength } = useMemo(
		() => ({
			circumference: 2 * Math.PI * radius,
			totalSize: radius * 2 + strokeWidth * 2,
			strokeLength: (progress / 100) * (2 * Math.PI * radius),
		}),
		[radius, strokeWidth, progress]
	);

	// Handle initial animation
	const [offset, setOffset] = useState(circumference);
	useEffect(() => {
		setOffset(circumference);
		const timer = setTimeout(() => {
			setOffset(circumference - strokeLength);
		}, 100);

		return () => clearTimeout(timer);
	}, [progress, circumference, strokeLength]);

	const progressWithinRange = Math.max(MINIMUM_VALUE, Math.min(progress, MAXIMUM_VALUE));

	let fillColor;
	if (progressWithinRange < 50) {
		fillColor = theme.palette.success.main;
	} else if (progressWithinRange < 80) {
		fillColor = theme.palette.warning.lowContrast;
	} else {
		fillColor = theme.palette.error.lowContrast;
	}

	if (isLoading) {
		return (
			<Stack
				className="radial-chart"
				width={radius}
				height={radius}
				alignItems="center"
				justifyContent="center"
			>
				<CircularProgress color="accent" />
			</Stack>
		);
	}

	return (
		<Box
			className="radial-chart"
			width={radius}
			height={radius}
			sx={{ backgroundColor: theme.palette.primary.main, borderRadius: "50%" }}
		>
			<svg
				viewBox={`0 0 ${totalSize} ${totalSize}`}
				width={radius}
				height={radius}
			>
				<circle
					className="radial-chart-base"
					stroke={theme.palette.secondary.light}
					strokeWidth={strokeWidth}
					fill="none"
					cx={totalSize / 2} // Center the circle
					cy={totalSize / 2} // Center the circle
					r={radius}
				/>
				<circle
					className="radial-chart-progress"
					stroke={fillColor}
					strokeWidth={strokeWidth}
					strokeDasharray={`${circumference} ${circumference}`}
					strokeDashoffset={offset}
					strokeLinecap="round"
					fill="none"
					cx={totalSize / 2}
					cy={totalSize / 2}
					r={radius}
				/>
			</svg>

			<Typography
				className="radial-chart-text"
				style={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					...theme.typography.h2,
					fill: theme.typography.h2.color,
				}}
			>
				{`${progressWithinRange.toFixed(precision)}${unit}`}
			</Typography>
		</Box>
	);
};

export default CustomGauge;

CustomGauge.propTypes = {
	isLoading: PropTypes.bool,
	progress: PropTypes.number,
	radius: PropTypes.number,
	strokeWidth: PropTypes.number,
	precision: PropTypes.number,
	unit: PropTypes.string,
};
