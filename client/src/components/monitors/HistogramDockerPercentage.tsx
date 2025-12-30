import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseChart } from "@/components/monitors/Chart";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { XTick } from "@/components/monitors/ChartResponseTime";
import { useTheme } from "@mui/material/styles";

export const HistogramDockerPercentage = ({
  data,
  dataKey,
  range,
  title,
  emptyText,
}: {
  data: any[];
  dataKey: string;
  range: string;
  title: string;
  emptyText?: string;
}) => {
  const theme = useTheme();
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <BaseChart title={title} icon={null}>
      {!hasData ? (
        <Stack height={"100%"} alignItems={"center"} justifyContent={"center"}>
          <Typography variant="h2">{emptyText || "No data"}</Typography>
        </Stack>
      ) : (
        <ResponsiveContainer width="100%" height={155}>
          <AreaChart data={data}>
            <CartesianGrid
              stroke={theme.palette.divider}
              strokeWidth={1}
              strokeOpacity={1}
              fill="transparent"
              vertical={false}
            />
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={theme.palette.primary.main}
                  stopOpacity={0.8}
                />
                <stop
                  offset="100%"
                  stopColor={theme.palette.primary.light}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey={"_id"}
              tick={(props) => <XTick {...props} range={range} />}
            />
            <YAxis />
            <Area
              dataKey={dataKey}
              stroke={theme.palette.primary.main}
              fill="url(#area)"
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </BaseChart>
  );
};
