import type { ICheck, CheckTimingPhases } from "@/types/check";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { BaseBox } from "@/components/design-elements";

type TimingsChartProps = { check: ICheck | null };

export type TimingSegment = {
  key: keyof CheckTimingPhases;
  label: string;
  value: number;
  percent: number;
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
  const segments = buildTimingSegments(check?.timings?.phases);
  if (!segments.length) return null;
  if (!check) return null;

  const theme = useTheme();
  const strokeColor = alpha(theme.palette.success.main, 0.8);

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
              nameKey="label"
              fill="transparent"
              stroke={strokeColor}
              strokeWidth={1}
              label={({ name, value }: any) => `${name}: ${Math.round(Number(value) || 0)} ms`}
            >
              {segments.map((entry) => (
                <Cell key={`cell-${entry.key}`} fill="transparent" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => `${Math.round(value as number)} ms`}
            />
          </PieChart>
        </ResponsiveContainer>
      </Stack>
    </BaseBox>
  );
};
