import {
  MonitorBasePageWithStates,
  UpStatusBox,
  DownStatusBox,
  PausedStatusBox,
  InfoBox,
} from "@/components/design-elements";
import { HeaderCreate } from "@/components/monitors";
import Stack from "@mui/material/Stack";
import { Dialog } from "@/components/inputs";
import { PageSpeedMonitorTable } from "./PageSpeedMonitorTable";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import type { IMonitor, IMonitorWithStats } from "@/types/monitor";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState } from "react";
import { useDelete } from "@/hooks/UseApi";

const GLOBAL_REFRESH = import.meta.env.VITE_APP_GLOBAL_REFRESH;

const PageSpeedMonitorsPage = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const [selectedMonitor, setSelectedMonitor] = useState<IMonitor | null>(null);
  const isDialogOpen = Boolean(selectedMonitor);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { deleteFn } = useDelete();
  const { response, loading, isValidating, error, refetch } = useGet<
    ApiResponse<IMonitorWithStats>
  >(
    `/monitors?embedChecks=true&type=pagespeed&page=${page}&rowsPerPage=${rowsPerPage}`,
    {},
    {
      refreshInterval: GLOBAL_REFRESH,
      keepPreviousData: true,
      dedupingInterval: 0,
    },
    {
      useTeamIdAsKey: true,
    }
  );
  const monitors: IMonitor[] = response?.data?.monitors ?? ([] as IMonitor[]);
  const count = response?.data?.count || 0;
  const upCount = response?.data?.upCount || 0;
  const downCount = response?.data?.downCount || 0;
  const pausedCount = response?.data?.pausedCount || 0;

  const handleConfirm = async () => {
    await deleteFn(`/monitors/${selectedMonitor?._id}`);
    setSelectedMonitor(null);
    refetch();
  };

  const handleCancel = () => {
    setSelectedMonitor(null);
  };

  return (
    <MonitorBasePageWithStates
      loading={isValidating}
      error={error}
      items={monitors}
      page="pageSpeed"
      actionLink="/pagespeed/create"
    >
      <InfoBox
        title="Website Performance Tracking"
        description="Measure how fast your websites load and identify performance bottlenecks. Track Core Web Vitals and get actionable insights to improve user experience."
      />
      <HeaderCreate isLoading={loading} path="/pagespeed/create" />
      <Stack direction={isSmall ? "column" : "row"} gap={theme.spacing(8)}>
        <UpStatusBox n={upCount} />
        <DownStatusBox n={downCount} />
        <PausedStatusBox n={pausedCount} />
      </Stack>
      <PageSpeedMonitorTable
        monitors={monitors}
        refetch={refetch}
        setSelectedMonitor={setSelectedMonitor}
        count={count}
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
      />
      <Dialog
        open={isDialogOpen}
        title={t("deleteDialogTitle")}
        content={t("deleteDialogDescription")}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </MonitorBasePageWithStates>
  );
};

export default PageSpeedMonitorsPage;
