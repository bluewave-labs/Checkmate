import { BasePage, StatBox } from "@/components/design-elements";
import { HeaderControls, HeaderRange } from "@/components/monitors";
import Stack from "@mui/material/Stack";
import prettyMilliseconds from "pretty-ms";
import { getStatusPalette } from "@/utils/MonitorUtils";
import { InfraDetailsGraphs } from "@/pages/infrastructure/InfraDetailsGraphs";

import { useTranslation } from "react-i18next";
import { useGet, usePatch } from "@/hooks/UseApi";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { useParams } from "react-router";
import type { ApiResponse } from "@/types/api";
import type { IMonitor, IMonitorWithMonitorStats } from "@/types/monitor";
import {
  getFrequency,
  getCores,
  getAvgTemp,
  getGbs,
  getDiskTotalGbs,
  getOsAndPlatform,
} from "@/pages/infrastructure/InfraUtils";
import { InfraDetailsGauges } from "./InfraDetailsGauges";
import { config } from "@/config/index";
const GLOBAL_REFRESH = config.GLOBAL_REFRESH;

const InfraDetailsPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = useParams();
  const [range, setRange] = useState("1h");

  const { response, isValidating, refetch } = useGet<
    ApiResponse<IMonitorWithMonitorStats>
  >(
    `/monitors/${id}?embedChecks=true&range=${range}`,
    {},
    { refreshInterval: GLOBAL_REFRESH, keepPreviousData: true }
  );

  const { patch, loading: isPatching } = usePatch<any, IMonitor>();

  const monitor = response?.data?.monitor;
  const stats = response?.data?.stats;
  const checks = Array.isArray(response?.data?.checks)
    ? response?.data?.checks
    : [];
  const palette = getStatusPalette(monitor?.status ?? "initializing");

  const streakStartedAt = stats?.currentStreakStartedAt ?? 0;
  const streakDuration = streakStartedAt > 0 ? Date.now() - streakStartedAt : 0;

  const lastCheckTs = stats?.lastCheckTimestamp ?? -1;
  const lastChecked = lastCheckTs >= 0 ? Date.now() - lastCheckTs : -1;

  if (!monitor) {
    return null;
  }

  return (
    <BasePage>
      <HeaderControls
        monitor={monitor}
        patch={patch}
        isPatching={isPatching}
        refetch={refetch}
        path="/infrastructure"
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
        <StatBox
          title={t("monitors.common.stats.lastResponseTime")}
          subtitle={
            typeof stats?.lastResponseTime === "number"
              ? `${stats.lastResponseTime} ms`
              : "N/A"
          }
        />
        <StatBox
          title={t("monitors.common.stats.cpuPhysical")}
          subtitle={getCores(checks?.[0]?.cpu?.physical_core || 0)}
        />
        <StatBox
          title={t("monitors.common.stats.cpuLogical")}
          subtitle={getCores(checks?.[0]?.cpu?.logical_core || 0)}
        />
        <StatBox
          title={t("monitors.common.stats.cpuFrequency")}
          subtitle={getFrequency(checks?.[0]?.cpu?.current_frequency || 0)}
        />
        <StatBox
          title={t("monitors.common.stats.cpuTemperature")}
          subtitle={getAvgTemp(checks?.[0]?.cpu?.temperature || [])}
        />
        <StatBox
          title={t("monitors.common.stats.memory")}
          subtitle={getGbs(checks?.[0]?.memory?.total_bytes || 0)}
        />
        <StatBox
          title={t("monitors.common.stats.disk")}
          subtitle={getDiskTotalGbs(checks?.[0]?.disk)}
        />
        <StatBox
          title={t("monitors.common.stats.os")}
          subtitle={getOsAndPlatform(checks?.[0]?.host || {})}
        />
      </Stack>

      <InfraDetailsGauges checks={checks} />
      <HeaderRange loading={isValidating} range={range} setRange={setRange} />
      <InfraDetailsGraphs checks={checks} range={range} />
      {/* <Typography variant="h1">Network</Typography>
      <InfraDetailsNetGraphs checks={checks} range={range} /> */}
    </BasePage>
  );
};

export default InfraDetailsPage;
