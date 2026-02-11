import { BaseChart } from "@/Components/v2/design-elements";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useTheme } from "@mui/material/styles";
import { useMemo, useState, useEffect } from "react";
import { getInfraGaugeColor } from "@/Utils/MonitorUtils";

const MINIMUM_VALUE = 0;
const MAXIMUM_VALUE = 100;

export const Gauge = ({
	isLoading = false,
	progress = 0,
	radius = 70,
	strokeWidth = 15,
	precision = 1,
	unit = "%",
}: {
	isLoading?: boolean;
	progress?: number;
	radius?: number;
	strokeWidth?: number;
	precision?: number;
	unit?: string;
}) => {
	const theme = useTheme();
	const progressWithinRange = Math.max(MINIMUM_VALUE, Math.min(progress, MAXIMUM_VALUE));

	// Calculate the length of the stroke for the circle
	const { circumference, totalSize, strokeLength } = useMemo(
		() => ({
			circumference: 2 * Math.PI * radius,
			totalSize: radius * 2 + strokeWidth * 2,
			strokeLength: (progress / 100) * (2 * Math.PI * radius),
		}),
		[radius, strokeWidth, progress]
	);

	const [offset, setOffset] = useState(circumference);
	useEffect(() => {
		setOffset(circumference);
		const timer = setTimeout(() => {
			setOffset(circumference - strokeLength);
		}, 100);

		return () => clearTimeout(timer);
	}, [progress, circumference, strokeLength]);

	const fillColor = getInfraGaugeColor(progressWithinRange, theme);

	if (isLoading) {
		return;
	}

	return (
		<Box
			display={"inline-block"}
			position={"relative"}
			width={radius}
			height={radius}
			bgcolor={theme.palette.background.paper}
			borderRadius={"50%"}
		>
			<svg
				viewBox={`0 0 ${totalSize} ${totalSize}`}
				width={radius}
				height={radius}
			>
				<circle
					stroke={theme.palette.secondary.main}
					strokeWidth={strokeWidth}
					fill="none"
					cx={totalSize / 2}
					cy={totalSize / 2}
					r={radius}
				/>
				<circle
					stroke={fillColor}
					strokeWidth={strokeWidth}
					strokeDasharray={`${circumference} ${circumference}`}
					strokeDashoffset={offset}
					fill="none"
					cx={totalSize / 2}
					cy={totalSize / 2}
					r={radius}
					style={{
						transform: "rotate(-90deg)",
						transformOrigin: "center",
						transition: "stroke-dashoffset 1.5s ease-in-out",
					}}
				/>
			</svg>

			<Typography
				style={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
				}}
			>
				{`${progressWithinRange.toFixed(precision)}${unit}`}
			</Typography>
		</Box>
	);
};

export const DetailGauge = ({
	title,
	progress,
	upperLabel,
	upperValue,
	lowerLabel,
	lowerValue,
}: {
	title: string;
	progress: number;
	upperLabel?: string;
	upperValue?: string | number;
	lowerLabel?: string;
	lowerValue?: string | number;
}) => {
	const theme = useTheme();
	return (
		<BaseChart
			icon={null}
			title={title}
			maxWidth={225}
		>
			<Stack
				alignItems={"center"}
				mb={theme.spacing(4)}
				gap={theme.spacing(4)}
			>
				<Gauge progress={progress} />
			</Stack>
			<Stack
				direction={"row"}
				justifyContent={"space-between"}
			>
				<Typography>{upperLabel}</Typography>
				<Typography>{upperValue}</Typography>
			</Stack>
			<Stack
				direction={"row"}
				justifyContent={"space-between"}
			>
				<Typography>{lowerLabel}</Typography>
				<Typography>{lowerValue}</Typography>
			</Stack>
		</BaseChart>
	);
};
