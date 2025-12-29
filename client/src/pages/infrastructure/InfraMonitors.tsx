import {
  MonitorBasePageWithStates,
  UpStatusBox,
  DownStatusBox,
  PausedStatusBox,
  InfoBox,
} from "@/components/design-elements";
import { HeaderCreate } from "@/components/common";
import Stack from "@mui/material/Stack";
import { Dialog } from "@/components/inputs";
import { InfraMonitorsTable } from "./InfraMonitorsTable";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import type { IMonitor, IMonitorWithStats } from "@/types/monitor";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState } from "react";
import { useDelete } from "@/hooks/UseApi";
import { InitializingStatusBox } from "@/components/design-elements/StatusBox";
import { config } from "@/config/index";
import { useLimitReached } from "@/hooks/UsePlanEntitlements";

const GLOBAL_REFRESH = config.GLOBAL_REFRESH;

const InfraMonitorsPage = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const [selectedMonitor, setSelectedMonitor] = useState<IMonitor | null>(null);
  const isDialogOpen = Boolean(selectedMonitor);
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { deleteFn, loading: isDeleting } = useDelete();
  const requestParams = [
    "embedChecks=true",
    "type=infrastructure",
    `sortField=${sortField}`,
    `sortOrder=${sortOrder}`,
    `page=${page}`,
    `rowsPerPage=${rowsPerPage}`,
  ];

  const monitorRequestUrl = `/monitors?${requestParams.join("&")}`;

  const { response, loading, isValidating, error, refetch } = useGet<
    ApiResponse<IMonitorWithStats>
  >(
    monitorRequestUrl,
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

  const monitorLimitReached = useLimitReached("monitorsMax", count);

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
      monitorLimitReached={monitorLimitReached}
      page="infrastructure"
      actionLink="/infrastructure/create"
    >
      <InfoBox
        title={t("monitors.infrastructure.infoBox.title")}
        description={t("monitors.infrastructure.infoBox.description")}
      />
      <HeaderCreate
        isLoading={loading}
        path="/infrastructure/create"
        entitlement="monitorsMax"
        entitlementCount={count}
      />
      <Stack direction={isSmall ? "column" : "row"} gap={theme.spacing(8)}>
        <UpStatusBox n={upCount} />
        <DownStatusBox n={downCount} />
        <PausedStatusBox n={pausedCount} />
        <InitializingStatusBox
          n={count - (upCount + downCount + pausedCount)}
        />
      </Stack>
      <InfraMonitorsTable
        monitors={monitors}
        refetch={refetch}
        setSelectedMonitor={setSelectedMonitor}
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        count={count}
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
      />
      <Dialog
        open={isDialogOpen}
        title={t("common.dialog.delete.title")}
        content={t("common.dialog.delete.description")}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        loading={isDeleting}
      />
    </MonitorBasePageWithStates>
  );
};

export default InfraMonitorsPage;
