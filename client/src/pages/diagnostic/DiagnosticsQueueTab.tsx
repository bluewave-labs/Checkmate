import Stack from "@mui/material/Stack";
import { StatBox } from "@/components/design-elements";
import { Table } from "@/components/design-elements";

import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
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
        content: t("diagnosticsPage.tableHeaderId"),
        render: (row) => {
          return row?.id || "-";
        },
      },
      {
        id: "url",
        content: t("diagnosticsPage.tableHeaderUrl"),
        render: (row) => {
          return row?.data?.url || "-";
        },
      },
      {
        id: "interval",
        content: t("diagnosticsPage.tableHeaderInterval"),
        render: (row) => {
          if (!row?.data?.interval) return "-";
          const seconds = row.data.interval / 1000;
          return `${seconds}s`;
        },
      },
      {
        id: "type",
        content: t("diagnosticsPage.tableHeaderType"),
        render: (row) => {
          return row?.data?.type || "-";
        },
      },
      {
        id: "active",
        content: t("diagnosticsPage.tableHeaderActive"),
        render: (row) => {
          return row?.data?.isActive ? "true" : "false";
        },
      },

      {
        id: "runCount",
        content: t("diagnosticsPage.tableHeaderRunCount"),
        render: (row) => {
          return row?.runCount || "-";
        },
      },
      {
        id: "lastRun",
        content: t("diagnosticsPage.tableHeaderLastRun"),
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
        content: t("diagnosticsPage.tableHeaderLockedAt"),
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
        content: t("diagnosticsPage.tableHeaderLastFinishedAt"),
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
        content: t("diagnosticsPage.tableHeaderLastRunTook"),
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
          title={t("diagnosticsPage.statBoxJobsTitle")}
          subtitle={`${metrics?.jobs}`}
          sx={{ width: "100%" }}
          tooltip="Total number of monitoring jobs in the queue"
        />
        <StatBox
          title={t("diagnosticsPage.statBoxActiveJobsTitle")}
          subtitle={`${metrics.activeJobs}`}
          sx={{ width: "100%" }}
          tooltip="Jobs currently running or locked for execution"
        />
        <StatBox
          title={t("diagnosticsPage.statBoxFailingJobsTitle")}
          subtitle={`${metrics.failingJobs}`}
          sx={{ width: "100%" }}
          tooltip="Jobs that failed on their last execution"
        />
        <StatBox
          title={t("diagnosticsPage.statBoxTotalRunsTitle")}
          subtitle={`${metrics.totalRuns}`}
          sx={{ width: "100%" }}
          tooltip="Total number of job executions across all jobs"
        />
        <StatBox
          title={t("diagnosticsPage.statBoxTotalFailuresTitle")}
          subtitle={`${metrics.totalFailures}`}
          sx={{ width: "100%" }}
          tooltip="Total number of failed job executions across all jobs"
        />
      </Stack>
      <Table headers={headers} data={jobs} />
    </Stack>
  );
};
