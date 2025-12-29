import { BasePage, StatBox } from "@/components/design-elements";
import { HeaderControls, HeaderRange } from "@/components/monitors";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

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
  const latestCheck = checks[0];
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
      <Stack gap={theme.spacing(6)}>
        <Box component="pre" sx={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(latestCheck, null, 2)}
        </Box>
      </Stack>
    </BasePage>
  );
};

export default DockerDetailsPage;
