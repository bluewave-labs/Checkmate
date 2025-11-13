import { BaseChart } from "@/components/monitors/Chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Fragment, useId } from "react";
import { XTick } from "./ChartResponseTime";

import { useTheme } from "@mui/material/styles";
import type { IInfraCheck } from "@/types/check";

const AREA_COLORS = [
  // Blues
  "#3182bd", // Deep blue
  "#6baed6", // Medium blue
  "#9ecae1", // Light blue

  // Greens
  "#74c476", // Soft green
  "#a1d99b", // Light green
  "#c7e9c0", // Pale green

  // Oranges
  "#fdae6b", // Warm orange
  "#fdd0a2", // Light orange
  "#feedde", // Pale orange

  // Purples
  "#9467bd", // Lavender
  "#a55194", // Deep magenta
  "#c994c7", // Soft magenta

  // Reds
  "#ff9896", // Soft red
  "#de2d26", // Deep red
  "#fc9272", // Medium red

  // Cyans/Teals
  "#17becf", // Cyan
  "#7fcdbb", // Teal
  "#a1dab4", // Light teal

  // Yellows
  "#fec44f", // Mustard
  "#fee391", // Light yellow
  "#ffffd4", // Pale yellow

  // Additional colors
  "#e377c2", // Soft pink
  "#bcbd22", // Olive
  "#2ca02c", // Vibrant green
];

const createGradient = ({
  id,
  startColor,
  endColor,
  startOpacity = 0.8,
  endOpacity = 0,
  direction = "vertical",
}: {
  id: string;
  startColor: string;
  endColor: string;
  startOpacity?: number;
  endOpacity?: number;
  direction?: "vertical" | "horizontal";
}) => (
  <defs>
    <linearGradient
      id={id}
      x1={direction === "vertical" ? "0" : "0"}
      y1={direction === "vertical" ? "0" : "0"}
      x2={direction === "vertical" ? "0" : "1"}
      y2={direction === "vertical" ? "1" : "0"}
    >
      <stop offset="0%" stopColor={startColor} stopOpacity={startOpacity} />
      <stop offset="100%" stopColor={endColor} stopOpacity={endOpacity} />
    </linearGradient>
  </defs>
);

export const HistogramInfrastructure = ({
  range,
  title,
  idx,
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
}: {
  range: string;
  title: string;
  idx: number | null;
  checks: IInfraCheck[];
  xKey: string;
  yDomain?: number[];
  dataKeys: string[];
  gradient?: boolean;
  gradientDirection?: "vertical" | "horizontal";
  gradientStartColor?: string;
  gradientEndColor?: string;
  strokeColor: string;
  fillColor?: string;
}) => {
  const theme = useTheme();
  const uniqueId = useId();

  let avgTemps: { _id: string; avg_temp: number | null }[] = [];
  let tempYDomain: number[] = [];
  if (title === "temp") {
    avgTemps = checks.map((check) => {
      const temps = check.cpu.temperature || [];
      if (temps.length === 0) return { ...check, avg_temp: null };
      const totalTemp = temps.reduce((sum, temp) => sum + (temp || 0), 0);
      const avgTemp = totalTemp / temps.length;
      return { _id: check._id, avg_temp: avgTemp };
    });

    const maxTemp: number = avgTemps.reduce((max, item) => {
      return item.avg_temp && item.avg_temp > max ? item.avg_temp : max;
    }, 0);

    tempYDomain = [0, Math.ceil((maxTemp * 1.3) / 10) * 10];
  }

  return (
    <BaseChart icon={null} title={idx !== null ? title + ` ${idx}` : title}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={title === "temp" ? avgTemps : checks}>
          <XAxis
            dataKey={xKey}
            tick={(props) => <XTick {...props} range={range} />}
          />
          <YAxis domain={title === "temp" ? tempYDomain : yDomain} />

          <CartesianGrid
            stroke={theme.palette.primary.lowContrast}
            strokeWidth={1}
            strokeOpacity={1}
            fill="transparent"
            vertical={false}
          />
          {dataKeys?.map((dataKey, index) => {
            const gradientId = `gradient-${uniqueId}-${index}`;
            return (
              <Fragment key={dataKey}>
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
