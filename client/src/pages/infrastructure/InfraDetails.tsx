import { BasePage, StatBox } from "@/components/design-elements";
import { HeaderControls, HeaderRange } from "@/components/monitors";
import Stack from "@mui/material/Stack";
import prettyMilliseconds from "pretty-ms";
import { getStatusPalette } from "@/utils/MonitorUtils";
import { InfraDetailsGraphs } from "@/pages/infrastructure/InfraDetailsGraphs";

import { useGet, usePatch } from "@/hooks/UseApi";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { useParams } from "react-router";
import type { ApiResponse } from "@/hooks/UseApi";
import type { IMonitor, IMonitorWithMonitorStats } from "@/types/monitor";
import type { IInfraCheck } from "@/types/check";
import {
  getFrequency,
  getCores,
  getAvgTemp,
  getGbs,
  getDiskTotalGbs,
  getOsAndPlatform,
} from "@/pages/infrastructure/InfraUtils";
import { InfraDetailsGauges } from "./InfraDetailsGauges";

const GLOBAL_REFRESH = import.meta.env.VITE_APP_GLOBAL_REFRESH;

const InfraDetailsPage = () => {
  const theme = useTheme();
  const { id } = useParams();
  const [range, setRange] = useState("2h");

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
  const checks = (response?.data?.checks || []) as IInfraCheck[];
  const palette = getStatusPalette(monitor?.status || "initializing");

  const streakDuration = stats?.currentStreakStartedAt
    ? Date.now() - stats?.currentStreakStartedAt
    : 0;

  const lastChecked = stats?.lastCheckTimestamp
    ? Date.now() - stats?.lastCheckTimestamp
    : -1;

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
        <StatBox
          title="CPU (physical)"
          subtitle={getCores(checks[0]?.cpu?.physical_core)}
        />
        <StatBox
          title="CPU (logical)"
          subtitle={getCores(checks[0]?.cpu?.logical_core)}
        />
        <StatBox
          title="CPU frequency"
          subtitle={getFrequency(checks[0]?.cpu?.current_frequency)}
        />
        <StatBox
          title="Avg CPU temp"
          subtitle={getAvgTemp(checks[0]?.cpu?.temperature)}
        />
        <StatBox
          title="Memory"
          subtitle={getGbs(checks[0]?.memory?.total_bytes)}
        />
        <StatBox title="Disk" subtitle={getDiskTotalGbs(checks[0]?.disk)} />
        <StatBox title="OS" subtitle={getOsAndPlatform(checks[0]?.host)} />
      </Stack>
      {/* <Typography variant="h1">Infrastructure overview</Typography> */}

      <InfraDetailsGauges checks={checks} />
      <HeaderRange loading={isValidating} range={range} setRange={setRange} />
      <InfraDetailsGraphs checks={checks} range={range} />
      {/* <Typography variant="h1">Network</Typography>
      <InfraDetailsNetGraphs checks={checks} range={range} /> */}
    </BasePage>
  );
};

export default InfraDetailsPage;
