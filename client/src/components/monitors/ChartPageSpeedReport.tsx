import { BaseChart } from "@/components/monitors/Chart";
import { FileText } from "lucide-react";
import { Pie, PieChart, ResponsiveContainer, Label } from "recharts";
import Typography from "@mui/material/Typography";
import { getPageSpeedPalette } from "@/utils/MonitorUtils";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";

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
  const theme = useTheme();
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
      fill: alpha(
        theme.palette[pageSpeedPalette].lowContrast || "#ffffff",
        0.6
      ),
      stroke: "none",
    },
  ];

  return (
    <BaseChart icon={<FileText size={20} strokeWidth={1.5} />} title="Average PageSpeed score">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={score} dataKey="value" cx="50%" cy="50%" outerRadius="65%">
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
          />
        </PieChart>
      </ResponsiveContainer>
    </BaseChart>
  );
};
