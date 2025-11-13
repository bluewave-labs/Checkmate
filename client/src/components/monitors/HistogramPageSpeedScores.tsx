import { BaseChart } from "@/components/monitors/Chart";
import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { HistogramPageSpeedScoresTooltip } from "./HistogramPageSpeedScoresTooltip";

import { useTheme } from "@mui/material/styles";
import type { GroupedCheck } from "@/types/check";
import type { Palette } from "@mui/material/styles";
type PaletteColorKey = Extract<
  keyof Palette,
  "primary" | "secondary" | "success" | "warning" | "accent"
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
    palette: "secondary",
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
    palette: "accent",
  },
};

export const HistogramPageSpeedScores = ({
  checks,
}: {
  checks: GroupedCheck[];
}) => {
  const theme = useTheme();
  return (
    <BaseChart icon={<TrendingUp size={20} strokeWidth={1.5} />} title="Score history">
      <ResponsiveContainer width="100%" minWidth={25} height={215}>
        <AreaChart data={checks}>
          <CartesianGrid
            stroke={theme.palette.primary.lowContrast}
            strokeWidth={1}
            strokeOpacity={1}
            fill="transparent"
            vertical={false}
          />
          <Tooltip
            cursor={{ stroke: theme.palette.primary.lowContrast }}
            content={<HistogramPageSpeedScoresTooltip config={config} />}
          />
          <defs>
            {Object.values(config).map(({ id, palette }) => {
              const startColor = theme.palette[palette].main;
              const endColor = theme.palette[palette].lowContrast;

              return (
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1" key={id}>
                  <stop offset="0%" stopColor={startColor} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={endColor} stopOpacity={0} />
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
