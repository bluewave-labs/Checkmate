import { BasePage, StatBox } from "@/components/design-elements";
import {
  HeaderControls,
  HeaderRange,
  BarDockerCount,
  HistogramDockerPercentage,
} from "@/components/monitors";
import Stack from "@mui/material/Stack";
import { CardDockerContainer } from "@/components/monitors";

import { useTranslation } from "react-i18next";
import prettyMilliseconds from "pretty-ms";
import { useGet, usePatch } from "@/hooks/UseApi";
import { useState } from "react";
import { useParams } from "react-router";
import type { ApiResponse } from "@/types/api";
import type { IMonitor, IMonitorWithMonitorStats } from "@/types/monitor";
import { useTheme } from "@mui/material/styles";
import { getStatusPalette } from "@/utils/MonitorUtils";
import { config } from "@/config/index";
const GLOBAL_REFRESH = config.GLOBAL_REFRESH;

const DockerDetailsPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = useParams();
  const [range, setRange] = useState("1h");

  const { response, loading, refetch } = useGet<
    ApiResponse<IMonitorWithMonitorStats>
  >(
    `/monitors/${id}?embedChecks=true&range=${range}`,
    {},
    { refreshInterval: GLOBAL_REFRESH, keepPreviousData: true }
  );

  const { patch, loading: isPatching } = usePatch<any, IMonitor>();

  const monitor = response?.data?.monitor;
  const stats = response?.data?.stats;
  const checks = (response?.data?.checks || []) as any;
  const snapshot = monitor?.latestChecks?.[0].dockerContainers || [];
  const palette = getStatusPalette(monitor?.status || "initializing");

  const streakDuration = stats?.currentStreakStartedAt
    ? Date.now() - stats?.currentStreakStartedAt
    : 0;

  const lastChecked = stats?.lastCheckTimestamp
    ? Date.now() - stats?.lastCheckTimestamp
    : -1;

  if (!monitor) return null;

  return (
    <BasePage>
      <HeaderControls
        monitor={monitor}
        patch={patch}
        isPatching={isPatching}
        refetch={refetch}
        path="/docker"
      />
      <Stack direction="row" gap={theme.spacing(8)} flexWrap={"wrap"}>
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
      </Stack>
      <HeaderRange loading={loading} range={range} setRange={setRange} />
      <Stack gap={theme.spacing(6)} direction={{ xs: "column", md: "row" }}>
        {snapshot.map((c: any) => (
          <CardDockerContainer key={c.container_id} container={c} />
        ))}
      </Stack>
      <Stack gap={theme.spacing(6)} direction={{ xs: "column", lg: "row" }}>
        <HistogramDockerPercentage
          data={checks}
          dataKey="healthyPercent"
          range={range}
          title={t("monitors.docker.details.healthyChart.title")}
          emptyText={t("monitors.docker.details.healthyChart.empty")}
        />
        <BarDockerCount
          data={checks}
          dataKey="healthyContainers"
          range={range}
          title={t("monitors.docker.details.healthyCountChart.title")}
          emptyText={t("monitors.docker.details.healthyCountChart.empty")}
        />
      </Stack>

      <Stack gap={theme.spacing(6)} direction={{ xs: "column", lg: "row" }}>
        <HistogramDockerPercentage
          data={checks}
          dataKey="runningPercent"
          range={range}
          title={t("monitors.docker.details.runningChart.title")}
          emptyText={t("monitors.docker.details.runningChart.empty")}
        />
        <BarDockerCount
          data={checks}
          dataKey="runningContainers"
          range={range}
          title={t("monitors.docker.details.runningCountChart.title")}
          emptyText={t("monitors.docker.details.runningCountChart.empty")}
        />
      </Stack>
    </BasePage>
  );
};

export default DockerDetailsPage;
