import { BaseChart } from "@/Components/v2/design-elements";
import { TrendingUp } from "lucide-react";
import { XTick } from "@/Components/v2/monitors/";
import {
	XAxis,
	AreaChart,
	Area,
	Tooltip,
	CartesianGrid,
	ResponsiveContainer,
} from "recharts";
import { HistogramPageSpeedScoresTooltip } from "@/Components/v2/monitors";

import { useTheme } from "@mui/material/styles";
import type { CheckSnapshot } from "@/Types/Check";
import type { Palette } from "@mui/material/styles";
type PaletteColorKey = Extract<
	keyof Palette,
	"primary" | "error" | "success" | "warning"
>;

export interface ConfigItem {
	id: string;
	text: string;
	palette: PaletteColorKey;
}

const config: Record<string, ConfigItem> = {
	seo: {
		id: "seo",
		text: "SEO",
		palette: "primary",
	},
	performance: {
		id: "performance",
		text: "performance",
		palette: "success",
	},
	bestPractices: {
		id: "bestPractices",
		text: "best practices",
		palette: "warning",
	},
	accessibility: {
		id: "accessibility",
		text: "accessibility",
		palette: "error",
	},
};

export const HistogramPageSpeedDetails = ({
	checks,
	range,
}: {
	checks: CheckSnapshot[];
	range: string;
}) => {
	const theme = useTheme();
	return (
		<BaseChart
			icon={
				<TrendingUp
					size={20}
					strokeWidth={1.5}
				/>
			}
			title="Score history"
		>
			<ResponsiveContainer
				width="100%"
				minWidth={25}
				height={215}
			>
				<AreaChart data={checks}>
					<XAxis
						dataKey={"createdAt"}
						tick={(props) => (
							<XTick
								{...props}
								range={range}
							/>
						)}
					/>
					<CartesianGrid
						stroke={theme.palette.divider}
						strokeWidth={1}
						strokeOpacity={1}
						fill="transparent"
						vertical={false}
					/>
					<Tooltip
						cursor={{ stroke: theme.palette.divider }}
						content={<HistogramPageSpeedScoresTooltip config={config} />}
					/>
					<defs>
						{Object.values(config).map(({ id, palette }) => {
							const startColor = theme.palette[palette].main;
							const endColor = theme.palette[palette].light;

							return (
								<linearGradient
									id={id}
									x1="0"
									y1="0"
									x2="0"
									y2="1"
									key={id}
								>
									<stop
										offset="0%"
										stopColor={startColor}
										stopOpacity={0.8}
									/>
									<stop
										offset="100%"
										stopColor={endColor}
										stopOpacity={0}
									/>
								</linearGradient>
							);
						})}
					</defs>
					{Object.keys(config).map((key) => {
						const { palette } = config[key];
						const strokeColor = theme.palette[palette].main;
						const bgColor = theme.palette.primary.main;

						return (
							<Area
								connectNulls
								key={key}
								dataKey={key}
								stackId={1}
								stroke={strokeColor}
								fill={`url(#${config[key].id})`}
								activeDot={{ stroke: bgColor, fill: strokeColor, r: 4.5 }}
							/>
						);
					})}
				</AreaChart>
			</ResponsiveContainer>
		</BaseChart>
	);
};
