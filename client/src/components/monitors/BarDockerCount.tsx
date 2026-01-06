import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseChart } from "@/components/monitors/Chart";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { XTick } from "@/components/monitors/ChartResponseTime";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { BaseBox } from "@/components/design-elements";
import { useAppSelector } from "@/hooks/AppHooks";
import { formatDateWithTz, tooltipDateFormatLookup } from "@/utils/TimeUtils";
import { useTranslation } from "react-i18next";
import type { AggregateCheck } from "@/types/check";
export const BarDockerCount = ({
  data,
  dataKey,
  range,
  title,
  emptyText,
}: {
  data: AggregateCheck[];
  dataKey: string;
  range: string;
  title: string;
  emptyText?: string;
}) => {
  const theme = useTheme();
  const hasData = Array.isArray(data) && data.length > 0;
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const uiTimezone = useAppSelector((state: any) => state.ui.timezone);
  const { t } = useTranslation();

  const CountTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !label) return null;
    const fmt = tooltipDateFormatLookup(range);
    const value = payload?.[0]?.payload?.[dataKey] ?? 0;
    return (
      <BaseBox sx={{ py: theme.spacing(2), px: theme.spacing(4) }}>
        <Typography>
          {formatDateWithTz(String(label), fmt, uiTimezone)}
        </Typography>
        <Typography>
          {t("monitors.docker.details.tooltips.containers", { value })}
        </Typography>
      </BaseBox>
    );
  };

  return (
    <BaseChart
      title={title}
      icon={null}
      padding={{ xs: theme.spacing(4), md: theme.spacing(8) }}
    >
      {!hasData ? (
        <Stack height={"100%"} alignItems={"center"} justifyContent={"center"}>
          <Typography variant="h2">{emptyText || "No data"}</Typography>
        </Stack>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={[...data].reverse()}
            margin={{ top: 8, right: 8, left: isSmall ? 4 : 12, bottom: 8 }}
          >
            <defs>
              <linearGradient id={"gradient"} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={theme.palette.primary.main}
                  stopOpacity={0.85}
                />
                <stop
                  offset="100%"
                  stopColor={theme.palette.primary.light}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke={theme.palette.divider}
              strokeWidth={1}
              vertical={false}
            />
            <XAxis
              dataKey={"bucketDate"}
              tick={(props) => <XTick {...props} range={range} />}
            />
            <YAxis
              allowDecimals={false}
              width={isSmall ? 24 : 36}
              tick={{ fontSize: isSmall ? 10 : 11 }}
              tickMargin={4}
            />
            <Tooltip content={<CountTooltip />} cursor={false} />
            <Bar dataKey={dataKey} fill={`url(#gradient)`} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </BaseChart>
  );
};

export default BarDockerCount;
