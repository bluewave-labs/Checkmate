import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseChart } from "@/components/monitors/Chart";
import { ResponsiveContainer, BarChart, XAxis, Bar, Cell } from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";

import type { GroupedCheck } from "@/types/check";
import type { MonitorStatus } from "@/types/monitor";

import { normalizeResponseTimes } from "@/utils/DataUtils";
import { useState } from "react";
import { formatDateWithTz } from "@/utils/TimeUtils";
import { useAppSelector } from "@/hooks/AppHooks";
import { useTheme } from "@mui/material/styles";
import { getResponseTimeColor } from "@/utils/MonitorUtils";

const XLabel = ({
  p1,
  p2,
  range,
}: {
  p1: GroupedCheck;
  p2: GroupedCheck;
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
        fill={theme.palette.primary.contrastTextTertiary}
      >
        {formatDateWithTz(p1._id, dateFormat, uiTimezone)}
      </text>
      <text
        x="100%"
        y="100%"
        dy={-3}
        textAnchor="end"
        fontSize={11}
        fill={theme.palette.primary.contrastTextTertiary}
      >
        {formatDateWithTz(p2._id, dateFormat, uiTimezone)}
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
  checks: GroupedCheck[];
  status: MonitorStatus;
  range: string;
  title: string;
}) => {
  const uiTimezone = useAppSelector((state: any) => state.ui.timezone);

  const icon = status === "up" ? <TrendingUp size={20} strokeWidth={1.5} /> : <AlertTriangle size={20} strokeWidth={1.5} />;
  const theme = useTheme();
  const [idx, setIdx] = useState<number | null>(null);
  const dateFormat = range === "1d" || range === "2h" ? "MMM D, h A" : "MMM D";
  const normalChecks = normalizeResponseTimes(checks, "avgResponseTime");

  if (normalChecks.length === 0) {
    return (
      <BaseChart icon={icon} title={title}>
        <Stack height={"100%"} alignItems={"center"} justifyContent={"center"}>
          <Typography variant="h2">
            {status === "up" ? "No checks yet" : "Great, no downtime yet!"}
          </Typography>
        </Stack>
      </BaseChart>
    );
  }

  const totalChecks = normalChecks.reduce((count, check) => {
    return count + check.count;
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
            <Typography>Total checks</Typography>
            {idx ? (
              <Stack>
                <Typography variant="h2">
                  {normalChecks?.[idx]?.count}
                </Typography>
                <Typography position={"absolute"} top={"100%"}>
                  {formatDateWithTz(
                    normalChecks?.[idx]?._id,
                    dateFormat,
                    uiTimezone
                  )}
                </Typography>
              </Stack>
            ) : (
              <Typography variant="h2">{totalChecks}</Typography>
            )}
          </Stack>
        </Stack>
        <ResponsiveContainer width="100%" height={155}>
          <BarChart data={normalChecks}>
            <XAxis
              stroke={theme.palette.primary.lowContrast}
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
            <Bar
              dataKey="normalResponseTime"
              maxBarSize={7}
              background={{ fill: "transparent" }}
            >
              {normalChecks?.map((groupedCheck, idx) => {
                const fillColor = getResponseTimeColor(
                  groupedCheck.normalResponseTime
                );
                return (
                  <Cell
                    onMouseEnter={() => setIdx(idx)}
                    onMouseLeave={() => setIdx(null)}
                    key={groupedCheck._id}
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
