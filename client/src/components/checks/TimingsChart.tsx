import type { ICheck, CheckTimingPhases } from "@/types/check";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

type TimingsChartProps = { check: ICheck | null };

export type TimingSegment = {
  key: keyof CheckTimingPhases;
  label: string;
  value: number; // milliseconds
  percent: number; // 0..100
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

const buildTimingSegments = (phases?: CheckTimingPhases): TimingSegment[] => {
  if (!phases) return [];
  const raw = PHASE_ORDER.map((key) => ({
    key,
    value: Math.max(0, Number((phases as any)[key] ?? 0)),
  }));
  const total = raw.reduce((sum, p) => sum + p.value, 0);
  if (total <= 0) {
    return raw.map(({ key, value }) => ({
      key,
      label: key,
      value,
      percent: 0,
    }));
  }
  return raw.map(({ key, value }) => ({
    key,
    label: key,
    value,
    percent: (value / total) * 100,
  }));
};

export const TimingsChart = ({ check }: TimingsChartProps) => {
  console.log(check);
  const segments = buildTimingSegments(check?.timings?.phases);
  if (!segments.length) return null;
  if (!check) return null;

  const colors = [
    alpha("#1DE9B6", 0.8),
    alpha("#7C4DFF", 0.8),
    alpha("#FFB200", 0.8),
    alpha("#00AFFE", 0.8),
    alpha("#FF4181", 0.8),
    alpha("#59A14F", 0.8),
    alpha("#E15759", 0.8),
  ];

  return (
    <Stack spacing={2} sx={{ width: "100%", height: 260 }}>
      <Typography>Request timings</Typography>
      <Typography variant="body2">
        {" "}
        {`Total request time: ${check.timings.phases.total} ms`}
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={segments} dataKey="value" nameKey="label" stroke="none">
            {segments.map((entry, index) => (
              <Cell
                key={`cell-${entry.key}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any) => `${Math.round(value as number)} ms`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Stack>
  );
};
