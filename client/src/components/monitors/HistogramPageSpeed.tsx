import Stack from "@mui/material/Stack";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { HistogramPageSpeedTooltip } from "@/components/monitors/HistogramPageSpeedTooltip";

import { useTheme } from "@mui/material/styles";
import type { ICheck } from "@/types/check";
import type { MonitorStatus } from "@/types/monitor";

import { getStatusColor } from "@/utils/MonitorUtils";

const processData = (checks: ICheck[]) => {
  if (checks.length === 0) return [];
  const formattedData: { score: number; date: string }[] = [];

  const calculateScore = (entry: ICheck) => {
    const accessibility = entry?.lighthouse?.accessibility || 0;
    const bestPractices = entry?.lighthouse?.bestPractices || 0;
    const performance = entry?.lighthouse?.performance || 0;
    const seo = entry?.lighthouse?.seo || 0;
    return Math.floor(
      ((accessibility + bestPractices + performance + seo) / 4) * 100
    );
  };

  checks.forEach((entry) => {
    const score = calculateScore(entry);
    const date = entry.createdAt;
    formattedData.push({ score, date });
  });

  return formattedData;
};

export const HistogramPageSpeed = ({
  checks,
  status,
}: {
  checks: ICheck[];
  status: MonitorStatus;
}) => {
  const theme = useTheme();
  const scores = processData(checks);
  const color = getStatusColor(status, theme);
  return (
    <Stack
      direction="row"
      flexWrap="nowrap"
      gap={theme.spacing(1.5)}
      height="100px"
      width="400px"
      onClick={(event) => event.stopPropagation()}
      overflow={"hidden"}
      sx={{
        cursor: "default",
        position: "relative",
      }}
    >
      <ResponsiveContainer width="100%" height={"100%"}>
        <AreaChart
          data={scores}
          margin={{ top: 10, bottom: -5 }}
          style={{ cursor: "pointer" }}
        >
          <CartesianGrid
            stroke={theme.palette.primary.lowContrast}
            strokeWidth={1}
            strokeOpacity={1}
            fill="transparent"
            vertical={false}
          />
          <Tooltip
            cursor={{ stroke: theme.palette.primary.lowContrast }}
            content={<HistogramPageSpeedTooltip />}
          />
          <defs>
            <linearGradient
              id={`pagespeed-chart-${status}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.8} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="score"
            stroke={color}
            fill={`url(#pagespeed-chart-${status})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Stack>
  );
};
