import Stack from "@mui/material/Stack";
import { BasePage, StatBox } from "@/components/design-elements";
import { HeaderControls, HeaderRange } from "@/components/monitors";
import { HistogramPageSpeedScores } from "@/components/monitors/HistogramPageSpeedScores";
import { ChartPageSpeedReport } from "@/components/monitors/ChartPageSpeedReport";
import { ChartPageSpeedReportLegend } from "@/components/monitors/ChartPageSpeedReportLegend";

import { useState } from "react";
import { useParams } from "react-router";
import { useTheme } from "@mui/material/styles";
import { useGet, usePatch } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import type { IMonitor, IMonitorWithMonitorStats } from "@/types/monitor";
import { getStatusPalette } from "@/utils/MonitorUtils";
import prettyMilliseconds from "pretty-ms";
import useMediaQuery from "@mui/material/useMediaQuery";

const GLOBAL_REFRESH = import.meta.env.VITE_APP_GLOBAL_REFRESH;
const PageSpeedDetailsPage = () => {
  const theme = useTheme();
  const { id } = useParams();
  const [range, setRange] = useState("2h");
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  const { patch, loading: isPatching } = usePatch<any, IMonitor>();

  const { response, isValidating, refetch } = useGet<
    ApiResponse<IMonitorWithMonitorStats>
  >(
    `/monitors/${id}?embedChecks=true&range=${range}`,
    {},
    { refreshInterval: GLOBAL_REFRESH, keepPreviousData: true }
  );

  const monitor = response?.data?.monitor;
  const stats = response?.data?.stats;
  const checks = response?.data?.checks || [];
  console.log(checks);

  const streakDuration = stats?.currentStreakStartedAt
    ? Date.now() - stats?.currentStreakStartedAt
    : 0;

  const lastChecked = stats?.lastCheckTimestamp
    ? Date.now() - stats?.lastCheckTimestamp
    : -1;

  if (!monitor) {
    return null;
  }

  const palette = getStatusPalette(monitor?.status);
  return (
    <BasePage>
      <HeaderControls
        monitor={monitor}
        patch={patch}
        isPatching={isPatching}
        refetch={refetch}
        path="/pagespeed"
      />
      <Stack direction="row" gap={theme.spacing(8)}>
        <StatBox
          palette={palette}
          title="Active for"
          subtitle={prettyMilliseconds(streakDuration, {
            secondsDecimalDigits: 0,
          })}
        />
        <StatBox
          title="Last check"
          subtitle={
            lastChecked >= 0
              ? `${prettyMilliseconds(lastChecked, {
                  secondsDecimalDigits: 0,
                })} ago`
              : "N/A"
          }
        />
        <StatBox
          title="Last response time"
          subtitle={
            stats?.lastResponseTime ? `${stats?.lastResponseTime} ms` : "N/A"
          }
        />
      </Stack>
      <HeaderRange loading={isValidating} range={range} setRange={setRange} />
      <HistogramPageSpeedScores checks={checks} />
      <Stack direction={isSmall ? "column" : "row"} gap={theme.spacing(10)}>
        <ChartPageSpeedReport latestCheck={checks?.[0]} />
        <ChartPageSpeedReportLegend latestCheck={checks?.[0]} />
      </Stack>
    </BasePage>
  );
};

export default PageSpeedDetailsPage;
