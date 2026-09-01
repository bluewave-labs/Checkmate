import { BaseChart } from "@/Components/design-elements";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer } from "recharts";

// Types
import type { DockerContainerStats } from "@/Types/Monitor";

// Hooks
import { useTheme } from "@mui/material";
import { Fragment, useId } from "react";

// Utils
import { createGradient } from "@/Components/monitors/charts/ChartUtils";
interface HistogramDockerContainerProps {
	title: string;
	rightTitle: string;
	stats: DockerContainerStats;
	dataKey: string;
	strokeColor: string;
	gradientStartColor: string;
}

export const HistogramDockerContainer = ({
	title,
	rightTitle,
	stats,
	dataKey,
	strokeColor,
	gradientStartColor,
}: HistogramDockerContainerProps) => {
	const uniqueId = useId();
	const theme = useTheme();
	const gradientId = `gradient-${uniqueId}`;

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
