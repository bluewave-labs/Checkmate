import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseChart } from "@/components/monitors/Chart";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  Bar,
  Cell,
  Tooltip,
} from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";

import type { AggregateCheck } from "@/types/check";
import type { MonitorStatus } from "@/types/monitor";

import { useTranslation } from "react-i18next";
import { normalizeResponseTimes } from "@/utils/DataUtils";
import { formatDateWithTz } from "@/utils/TimeUtils";
import { useAppSelector } from "@/hooks/AppHooks";
import { useTheme } from "@mui/material/styles";
import { getResponseTimeColor } from "@/utils/MonitorUtils";

const XLabel = ({
  p1,
  p2,
  range,
}: {
  p1: AggregateCheck;
  p2: AggregateCheck;
  range: string;
}) => {
  const theme = useTheme();
  const uiTimezone = useAppSelector((state: any) => state.ui.timezone);
  const dateFormat = range === "day" ? "MMM D, h:mm A" : "MMM D";
  return (
    <>
      <text
        x={0}
        y="100%"
        dy={-3}
        textAnchor="start"
        fontSize={11}
        fill={theme.palette.text.secondary}
      >
        {formatDateWithTz(p1.bucketDate, dateFormat, uiTimezone)}
      </text>
      <text
        x="100%"
        y="100%"
        dy={-3}
        textAnchor="end"
        fontSize={11}
        fill={theme.palette.text.secondary}
      >
        {formatDateWithTz(p2.bucketDate, dateFormat, uiTimezone)}
      </text>
    </>
  );
};

export const HistogramStatus = ({
  checks,
  status,
  range,
  title,
}: {
  checks: AggregateCheck[];
  status: MonitorStatus;
  range: string;
  title: string;
}) => {
  const { t } = useTranslation();

  const icon =
    status === "up" ? (
      <TrendingUp size={20} strokeWidth={1.5} />
    ) : (
      <AlertTriangle size={20} strokeWidth={1.5} />
    );
  const theme = useTheme();
  const normalChecks = normalizeResponseTimes(checks, "avgResponseTime");

  const CustomTooltip = ({ active, payload }: any) => {
    const uiTimezone = useAppSelector((state: any) => state.ui.timezone);
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload as AggregateCheck & {
      avgResponseTime?: number;
    };
    const avg = d?.avgResponseTime ?? 0;
    const titleText = t("common.charts.uptime.avgResponseTime");
    const fmt = range === "30d" ? "MMM D, YYYY" : "ddd, MMM D, YYYY, h:mm A";
    let dateLabel = "";
    if (d?.bucketDate) {
      const base = new Date(d.bucketDate);
      const midBucket =
        range === "30d" ? new Date(base.getTime() + 12 * 60 * 60 * 1000) : base;
      dateLabel = formatDateWithTz(midBucket.toISOString(), fmt, uiTimezone);
    }
    return (
      <Stack
        sx={{
          p: 1,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        {dateLabel ? (
          <Typography sx={{ color: "text.secondary" }} variant="caption">
            {dateLabel}
          </Typography>
        ) : null}
        <Typography variant="caption">{titleText}</Typography>
        <Typography variant="body2">{Math.floor(avg)} ms</Typography>
      </Stack>
    );
  };

  if (normalChecks.length === 0) {
    return (
      <BaseChart icon={icon} title={title}>
        <Stack height={"100%"} alignItems={"center"} justifyContent={"center"}>
          <Typography variant="h2">
            {status === "up"
              ? t("common.charts.uptime.emptyUp")
              : t("common.charts.uptime.emptyDown")}
          </Typography>
        </Stack>
      </BaseChart>
    );
  }

  const totalChecks = normalChecks.reduce((count, check) => {
    return count + (check.count ?? 0);
  }, 0);

  return (
    <BaseChart icon={icon} title={title}>
      <Stack gap={theme.spacing(8)}>
        <Stack
          position="relative"
          direction="row"
          justifyContent="space-between"
        >
          <Stack>
            <Typography>Checks: {totalChecks}</Typography>
          </Stack>
        </Stack>
        <ResponsiveContainer width="100%" height={155}>
          <BarChart data={normalChecks}>
            <XAxis
              stroke={theme.palette.divider}
              height={15}
              tick={false}
              label={
                <XLabel
                  p1={normalChecks[0]}
                  p2={normalChecks[normalChecks.length - 1]}
                  range={range}
                />
              }
            />
            <Tooltip cursor={false} content={<CustomTooltip />} />
            <Bar
              dataKey="normalResponseTime"
              maxBarSize={7}
              background={{ fill: "transparent" }}
            >
              {normalChecks?.map((groupedCheck) => {
                const fillColor = getResponseTimeColor(
                  groupedCheck.normalResponseTime
                );
                return (
                  <Cell
                    key={groupedCheck.bucketDate}
                    fill={theme.palette[fillColor].main}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Stack>
    </BaseChart>
  );
};
