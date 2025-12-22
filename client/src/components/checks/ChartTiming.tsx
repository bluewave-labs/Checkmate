import type { ICheck, CheckTimingPhases } from "@/types/check";
import { PieChart, Pie, ResponsiveContainer, Tooltip, Legend } from "recharts";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { BaseBox } from "@/components/design-elements";

type TimingsChartProps = { check: ICheck | null };

export type TimingSegment = {
  name: string;
  value: number;
  fill: string;
  stroke: string;
};

const PHASE_ORDER: (keyof CheckTimingPhases)[] = [
  "wait",
  "dns",
  "tcp",
  "tls",
  "request",
  "firstByte",
  "download",
];

const buildTimingSegments = (
  phases: CheckTimingPhases | undefined,
  stroke: string
): TimingSegment[] => {
  if (!phases) return [];
  return PHASE_ORDER.map((key) => ({
    name: String(key),
    value: Math.max(0, Number((phases as any)[key] ?? 0)),
    fill: "transparent",
    stroke,
  }));
};

export const TimingsChart = ({ check }: TimingsChartProps) => {
  if (!check) return null;

  const theme = useTheme();
  const strokeColor = alpha(theme.palette.primary.main, 0.8);
  const segments = buildTimingSegments(check?.timings?.phases, strokeColor);
  if (!segments.length) return null;
  const LABEL_THRESHOLD = 0.05;

  const renderLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    name,
    value,
    percent,
  }: any) => {
    if (!percent || percent < LABEL_THRESHOLD) return null;
    const RAD = Math.PI / 180;
    const r = (outerRadius || 0) + 24;
    const x = cx + r * Math.cos(-midAngle * RAD);
    const y = cy + r * Math.sin(-midAngle * RAD);
    const text = `${name}: ${Math.round(Number(value) || 0)} ms`;
    return (
      <text
        x={x}
        y={y}
        fill={strokeColor}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        style={{ fontSize: 12 }}
      >
        {text}
      </text>
    );
  };

  const renderLegend = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {segments.map((s) => (
        <div
          key={s.name}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 2,
              backgroundColor: strokeColor,
            }}
          />
          <span style={{ fontSize: 12, color: theme.palette.text.secondary }}>
            {s.name}: {Math.round(Number(s.value) || 0)} ms
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <BaseBox p={4} flex={1} height={"100%"}>
      <Stack spacing={2} sx={{ width: "100%", height: 260 }}>
        <Typography>Request timings</Typography>
        <Typography variant="body2">
          {`Total request time: ${check.timings.phases.total} ms`}
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="value"
              nameKey="name"
              stroke="none"
              minAngle={4}
              label={renderLabel}
              labelLine={{ stroke: strokeColor, strokeWidth: 1, opacity: 0.6 }}
            />
            <Tooltip
              formatter={(value) => `${Math.round(value as number)} ms`}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              content={renderLegend}
              wrapperStyle={{ paddingLeft: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Stack>
    </BaseBox>
  );
};
