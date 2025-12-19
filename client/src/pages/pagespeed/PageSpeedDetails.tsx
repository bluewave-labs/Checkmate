import Stack from "@mui/material/Stack";
import { BasePage, StatBox } from "@/components/design-elements";
import { HeaderControls, HeaderRange } from "@/components/monitors";
import { HistogramPageSpeedScores } from "@/components/monitors/HistogramPageSpeedScores";
import { ChartPageSpeedReport } from "@/components/monitors/ChartPageSpeedReport";
import { ChartPageSpeedReportLegend } from "@/components/monitors/ChartPageSpeedReportLegend";

import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useParams } from "react-router";
import { useTheme } from "@mui/material/styles";
import { useGet, usePatch } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import type { IMonitor, IMonitorWithMonitorStats } from "@/types/monitor";
import { getStatusPalette } from "@/utils/MonitorUtils";
import prettyMilliseconds from "pretty-ms";
import useMediaQuery from "@mui/material/useMediaQuery";
import { config } from "@/config/index";

const GLOBAL_REFRESH = config.GLOBAL_REFRESH;
const PageSpeedDetailsPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = useParams();
  const [range, setRange] = useState("1h");
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
          title={t("monitors.common.stats.activeFor")}
          subtitle={prettyMilliseconds(streakDuration, {
            secondsDecimalDigits: 0,
          })}
        />
        <StatBox
          title={t("monitors.common.stats.lastCheck")}
          subtitle={
            lastChecked >= 0
              ? `${prettyMilliseconds(lastChecked, {
                  secondsDecimalDigits: 0,
                })} ago`
              : "N/A"
          }
        />
        <StatBox
          title={t("monitors.common.stats.lastResponseTime")}
          subtitle={
            stats?.lastResponseTime ? `${stats?.lastResponseTime} ms` : "N/A"
          }
        />
      </Stack>
      <HeaderRange loading={isValidating} range={range} setRange={setRange} />
      <HistogramPageSpeedScores checks={checks} range={range} />
      <Stack direction={isSmall ? "column" : "row"} gap={theme.spacing(10)}>
        <ChartPageSpeedReport latestCheck={checks?.[0]} />
        <ChartPageSpeedReportLegend latestCheck={checks?.[0]} />
      </Stack>
    </BasePage>
  );
};

export default PageSpeedDetailsPage;
