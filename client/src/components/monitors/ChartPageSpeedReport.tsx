import { BaseChart } from "@/components/monitors/Chart";
import { FileText } from "lucide-react";
import { Pie, PieChart, ResponsiveContainer, Label } from "recharts";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { getPageSpeedPalette } from "@/utils/MonitorUtils";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import { useTranslation } from "react-i18next";

const CenterLabel = ({ viewBox, value }: any) => {
  const { cx, cy } = viewBox;
  return (
    <foreignObject x={cx - 25} y={cy - 10} width={50} height={50}>
      <Typography variant="h1" align="center">
        {value}
      </Typography>
    </foreignObject>
  );
};

export const ChartPageSpeedReport = ({ latestCheck }: { latestCheck: any }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [hoverTitle, setHoverTitle] = useState<string | null>(null);

  const LABELS: Record<string, string> = {
    FCP: t("common.charts.pageSpeed.fcp"),
    SI: t("common.charts.pageSpeed.si"),
    LCP: t("common.charts.pageSpeed.lcp"),
    TBT: t("common.charts.pageSpeed.tbt"),
    CLS: t("common.charts.pageSpeed.cls"),
  };
  const metrics = [
    { key: "fcp", color: alpha("#1DE9B6", 0.6), weight: 0.1 },
    { key: "si", color: alpha("#7C4DFF", 0.6), weight: 0.1 },
    { key: "lcp", color: alpha("#FFB200", 0.6), weight: 0.25 },
    { key: "tbt", color: alpha("#00AFFE", 0.6), weight: 0.3 },
    { key: "cls", color: alpha("#FF4181", 0.6), weight: 0.25 },
  ];

  const scores = metrics.flatMap(({ key, color, weight }) => {
    const val = Math.floor((latestCheck?.[key] ?? 0) * 100);
    const inverse = 100 - val;
    return [
      {
        name: `${key.toUpperCase()} Inverse`,
        value: inverse * weight,
        fill: "transparent",
        stroke: color,
        weight,
      },
      {
        name: key.toUpperCase(),
        value: val * weight,
        fill: color,
        stroke: color,
        weight,
      },
    ];
  });

  const totalScore =
    (latestCheck?.fcp || 0) * 0.1 +
    (latestCheck?.si || 0) * 0.1 +
    (latestCheck?.lcp || 0) * 0.25 +
    (latestCheck?.tbt || 0) * 0.3 +
    (latestCheck?.cls || 0) * 0.25;

  const pageSpeedPalette = getPageSpeedPalette(Math.floor(totalScore * 100));

  const score = [
    {
      value: 100,
      fill: alpha(theme.palette[pageSpeedPalette].light || "#ffffff", 0.6),
      stroke: "none",
    },
  ];

  return (
    <BaseChart
      icon={<FileText size={20} strokeWidth={1.5} />}
      title={t("common.charts.pageSpeed.title")}
    >
      <Tooltip
        open={Boolean(hoverTitle)}
        title={hoverTitle || ""}
        arrow
        followCursor
        placement="top"
      >
        <Box
          sx={{
            "& .recharts-wrapper:focus, & .recharts-surface:focus": {
              outline: "none",
            },
            "& .recharts-wrapper *:focus": { outline: "none" },
            "& svg:focus, & g:focus, & path:focus": { outline: "none" },
            position: "relative",
          }}
        >
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={score}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius="65%"
              >
                <Label
                  position={"center"}
                  content={<CenterLabel value={Math.floor(totalScore * 100)} />}
                />
              </Pie>
              <Pie
                data={scores}
                innerRadius="70%"
                outerRadius="80%"
                label={({ name, value }) => `${name}: ${Math.round(value)}`}
                dataKey="value"
                stroke="none"
                onMouseEnter={(_, index: number) => {
                  const d = scores[index];
                  if (!d) return;
                  const isInverse = String(d.name).includes("Inverse");
                  const pair =
                    isInverse && scores[index + 1] ? scores[index + 1] : d;
                  const base = String(pair.name).replace(" Inverse", "");
                  const full = LABELS[base] ?? base;
                  const displayVal = Math.round(Number(pair.value) || 0);
                  setHoverTitle(`${full}: ${displayVal}`);
                }}
                onMouseLeave={() => setHoverTitle(null)}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Tooltip>
    </BaseChart>
  );
};
