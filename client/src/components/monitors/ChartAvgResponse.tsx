import { BaseChart } from "@/components/monitors/Chart";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Gauge } from "lucide-react";
import { Cell, RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

import { getResponseTimeColor } from "@/utils/MonitorUtils";
import { useTheme } from "@mui/material/styles";

export const ChartAvgResponse = ({
  avg,
  max,
}: {
  avg: number;
  max: number;
}) => {
  const theme = useTheme();
  const chartData = [
    { name: "max", value: max - avg, color: "transparent" },
    { name: "avg", value: avg, color: "red" },
  ];

  const palette = getResponseTimeColor(avg);
  const msg: Record<string, string> = {
    success: "Excellent",
    warning: "Average",
    danger: "Poor",
  };

  return (
    <BaseChart icon={<Gauge size={20} strokeWidth={1.5} />} title={"Average response time"}>
      <Stack height="100%" position={"relative"} justifyContent={"flex-end"}>
        <ResponsiveContainer width="100%" height={155}>
          <RadialBarChart
            cy="100%"
            data={chartData}
            startAngle={180}
            endAngle={0}
            innerRadius={"120%"}
            outerRadius={"200%"}
          >
            <RadialBar
              dataKey="value"
              background={{ fill: theme.palette[palette].lowContrast }}
            >
              <Cell visibility={"hidden"} />
              <Cell fill={theme.palette[palette].main} />
            </RadialBar>
          </RadialBarChart>
        </ResponsiveContainer>
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Typography variant="body2">Low</Typography>
          <Typography variant="body2">High</Typography>
        </Stack>
        <Stack
          position="absolute"
          top={"50%"}
          right={"50%"}
          sx={{
            transform: "translate(50%, 0%)",
          }}
        >
          <Typography variant="h6" textAlign={"center"}>
            {msg[palette]}
          </Typography>
          <Typography
            variant="h6"
            textAlign={"center"}
          >{`${avg?.toFixed()}ms`}</Typography>
        </Stack>
      </Stack>
    </BaseChart>
  );
};
