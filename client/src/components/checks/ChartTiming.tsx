import type { Check, CheckTimingPhases } from "@/types/check";
import { PieChart, Pie, ResponsiveContainer, Tooltip, Legend } from "recharts";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { useState } from "react";
import { BaseBox } from "@/components/design-elements";
import { useTranslation } from "react-i18next";
type TimingsChartProps = { check: Check | null };

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
  stroke: string,
  hoveredIndex: number | null,
  hoverFill: string
): TimingSegment[] => {
  if (!phases) return [];
  return PHASE_ORDER.map((key, i) => ({
    name: String(key),
    value: Math.max(0, Number((phases as any)[key] ?? 0)),
    fill: hoveredIndex === i ? hoverFill : "transparent",
    stroke,
  }));
};

export const TimingsChart = ({ check }: TimingsChartProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const strokeColor = alpha(theme.palette.primary.main, 0.8);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  if (!check) return null;
  const segments = buildTimingSegments(
    check?.timings?.phases,
    strokeColor,
    hoveredIndex,
    theme.palette.primary.main
  );
  if (!segments.length) return null;

  return (
    <BaseBox p={4} flex={1} height={"100%"}>
      <Stack spacing={2} sx={{ width: "100%", height: 400 }}>
        <Typography>{t("checks.details.timingChart.title")}</Typography>
        <Typography variant="body2">
          {t("checks.details.common.requestTime", {
            time: `${Math.floor(Number(check?.timings?.phases?.total ?? 0))} ms`,
          })}
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="value"
              nameKey="name"
              stroke="none"
              minAngle={4}
              onMouseEnter={(_, index: number) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            <Tooltip
              formatter={(value) => `${Math.floor(value as number)} ms`}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              payload={segments.map((s) => ({
                id: s.name,
                value: `${s.name}: ${Math.floor(Number(s.value) || 0)} ms`,
                type: "line",
                color: strokeColor,
              }))}
            />
          </PieChart>
        </ResponsiveContainer>
      </Stack>
    </BaseBox>
  );
};
