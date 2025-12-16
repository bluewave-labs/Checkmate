import { BasePage, StatBox } from "@/components/design-elements";
import {
  HeaderControls,
  HeaderRange,
  HistogramStatus,
  ChartAvgResponse,
  ChartResponseTime,
} from "@/components/monitors";
import Stack from "@mui/material/Stack";
import { CheckTable } from "@/pages/uptime/CheckTable";

import { useTranslation } from "react-i18next";
import type { IMonitor, IMonitorWithMonitorStats } from "@/types/monitor";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useParams } from "react-router";
import { useGet, usePatch } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import { useState } from "react";
import { getStatusPalette } from "@/utils/MonitorUtils";
import prettyMilliseconds from "pretty-ms";
import { config } from "@/config/index";

const GLOBAL_REFRESH = config.GLOBAL_REFRESH;

const UptimeDetailsPage = () => {
  const { id } = useParams();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const { t } = useTranslation();
  // Local state
  const [range, setRange] = useState("2h");

  const { response, loading, error, refetch } = useGet<
    ApiResponse<IMonitorWithMonitorStats>
  >(
    `/monitors/${id}?embedChecks=true&range=${range}`,

    {},
    { refreshInterval: GLOBAL_REFRESH, keepPreviousData: true }
  );

  const {
    response: upResponse,
    loading: upIsLoading,
    error: upError,
  } = useGet<ApiResponse<IMonitorWithMonitorStats>>(
    `/monitors/${id}?embedChecks=true&range=${range}&status=up`,
    {},
    { keepPreviousData: true }
  );

  const {
    response: downResponse,
    error: downError,
    loading: downIsLoading,
  } = useGet<ApiResponse<IMonitorWithMonitorStats>>(
    `/monitors/${id}?embedChecks=true&range=${range}&status=down`,
    {},
    { keepPreviousData: true }
  );

  const {
    patch,
    loading: isPatching,
    error: postError,
  } = usePatch<any, IMonitor>();

  const monitor = response?.data?.monitor;

  if (!monitor) {
    return null;
  }

  const stats = response?.data?.stats || null;
  const avgResponseTime = stats?.avgResponseTime || 0;
  const maxResponseTime = stats?.maxResponseTime || 0;

  const streakDuration = stats?.currentStreakStartedAt
    ? Date.now() - stats?.currentStreakStartedAt
    : 0;

  const lastChecked = stats?.lastCheckTimestamp
    ? Date.now() - stats?.lastCheckTimestamp
    : -1;

  const checks = response?.data?.checks || [];
  const upChecks = upResponse?.data?.checks
    ? [...upResponse.data.checks].reverse()
    : [];
  const downChecks = downResponse?.data?.checks
    ? [...downResponse.data.checks].reverse()
    : [];

  const palette = getStatusPalette(monitor?.status);

  if (error || upError || downError || postError) {
    console.error("Error fetching monitor data:", {
      error,
      upError,
      downError,
      postError,
    });
  }

  return (
    <BasePage>
      <HeaderControls
        monitor={monitor}
        patch={patch}
        isPatching={isPatching}
        refetch={refetch}
        path="/uptime"
      />
      <Stack direction={isSmall ? "column" : "row"} gap={theme.spacing(8)}>
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
        <StatBox
          title={t("monitors.common.stats.certificate")}
          subtitle={
            stats?.certificateExpiry
              ? new Date(stats.certificateExpiry).toLocaleString()
              : "N/A"
          }
        />
      </Stack>
      <HeaderRange
        loading={loading || upIsLoading || downIsLoading}
        range={range}
        setRange={setRange}
      />
      <Stack direction={isSmall ? "column" : "row"} gap={theme.spacing(8)}>
        <HistogramStatus
          title={t("common.charts.uptime.upTitle")}
          status={"up"}
          checks={upChecks}
          range={range}
        />
        <HistogramStatus
          title={t("common.charts.uptime.downTitle")}
          checks={downChecks}
          status={"down"}
          range={range}
        />
        <ChartAvgResponse avg={avgResponseTime} max={maxResponseTime} />
      </Stack>
      <ChartResponseTime checks={checks} range={range} />
      <CheckTable monitorId={monitor?._id} />
    </BasePage>
  );
};

export default UptimeDetailsPage;
