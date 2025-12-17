import Stack from "@mui/material/Stack";
import { StatBox } from "@/components/design-elements";
import { Table } from "@/components/design-elements";

import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import type { IJob, IJobMetrics } from "@/types/job";
import type { Header } from "@/components/design-elements/Table";

export const DiagnosticsQueueTab = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { response } = useGet<
    ApiResponse<{ jobs: IJob[]; metrics: IJobMetrics }>
  >(`/diagnostic/jobs`, {}, { refreshInterval: 5000 });

  const jobs: IJob[] = response?.data?.jobs || [];
  const metrics = response?.data?.metrics;

  if (!metrics) {
    return null;
  }

  const getHeaders = () => {
    const headers: Header<IJob>[] = [
      {
        id: "name",
        content: t("diagnostics.queue.table.headers.jobId"),
        render: (row) => {
          return row?.id || "-";
        },
      },
      {
        id: "url",
        content: t("diagnostics.queue.table.headers.url"),
        render: (row) => {
          return row?.data?.url || "-";
        },
      },
      {
        id: "interval",
        content: t("diagnostics.queue.table.headers.interval"),
        render: (row) => {
          if (!row?.data?.interval) return "-";
          const seconds = row.data.interval / 1000;
          return `${seconds}s`;
        },
      },
      {
        id: "type",
        content: t("common.table.headers.type"),
        render: (row) => {
          return row?.data?.type || "-";
        },
      },
      {
        id: "active",
        content: t("common.table.headers.active"),
        render: (row) => {
          return row?.active === true ? "true" : "false";
        },
      },

      {
        id: "runCount",
        content: t("diagnostics.queue.table.headers.runs"),
        render: (row) => {
          return row?.runCount || "-";
        },
      },
      {
        id: "lastRun",
        content: t("diagnostics.queue.table.headers.lastRun"),
        render: (row) => {
          if (!row?.lastRunAt) return "-";
          const date = new Date(row.lastRunAt);
          return (
            <Stack>
              <div>{date.toLocaleDateString()}</div>
              <div>{date.toLocaleTimeString()}</div>
            </Stack>
          );
        },
      },
      {
        id: "lockedAt",
        content: t("diagnostics.queue.table.headers.lockedAt"),
        render: (row) => {
          if (!row?.lockedAt) return "-";
          const date = new Date(row.lockedAt);
          return (
            <Stack>
              <div>{date.toLocaleDateString()}</div>
              <div>{date.toLocaleTimeString()}</div>
            </Stack>
          );
        },
      },
      {
        id: "lastFinishedAt",
        content: t("diagnostics.queue.table.headers.finishedAt"),
        render: (row) => {
          if (!row?.lastFinishedAt) return "-";
          const date = new Date(row.lastFinishedAt);
          return (
            <Stack>
              <div>{date.toLocaleDateString()}</div>
              <div>{date.toLocaleTimeString()}</div>
            </Stack>
          );
        },
      },
      {
        id: "lastRunTook",
        content: t("diagnostics.queue.table.headers.lastRunTook"),
        render: (row) => {
          return row?.lastRunTook || "-";
        },
      },
    ];
    return headers;
  };

  const headers = getHeaders();

  return (
    <Stack spacing={theme.spacing(8)}>
      <Stack direction={{ s: "column", md: "row" }} gap={theme.spacing(8)}>
        <StatBox
          title={t("diagnostics.queue.stats.monitoringJobs.title")}
          subtitle={`${metrics?.jobs}`}
          sx={{ width: "100%" }}
          tooltip={t("diagnostics.queue.stats.monitoringJobs.tooltip")}
        />
        <StatBox
          title={t("diagnostics.queue.stats.activeJobs.title")}
          subtitle={`${metrics.activeJobs}`}
          sx={{ width: "100%" }}
          tooltip={t("diagnostics.queue.stats.activeJobs.tooltip")}
        />
        <StatBox
          title={t("diagnostics.queue.stats.failingJobs.title")}
          subtitle={`${metrics.failingJobs}`}
          sx={{ width: "100%" }}
          tooltip={t("diagnostics.queue.stats.failingJobs.tooltip")}
        />
        <StatBox
          title={t("diagnostics.queue.stats.totalRuns.title")}
          subtitle={`${metrics.totalRuns}`}
          sx={{ width: "100%" }}
          tooltip={t("diagnostics.queue.stats.totalRuns.tooltip")}
        />
        <StatBox
          title={t("diagnostics.queue.stats.totalFailures.title")}
          subtitle={`${metrics.totalFailures}`}
          sx={{ width: "100%" }}
          tooltip={t("diagnostics.queue.stats.totalFailures.tooltip")}
        />
      </Stack>
      <Table headers={headers} data={jobs} />
    </Stack>
  );
};
