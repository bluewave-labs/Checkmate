import {
  MonitorBasePageWithStates,
  UpStatusBox,
  DownStatusBox,
  PausedStatusBox,
  InfoBox,
} from "@/components/design-elements";
import { HeaderFilter } from "@/components/monitors";
import { HeaderCreate } from "@/components/common";
import Stack from "@mui/material/Stack";
import { Dialog } from "@/components/inputs";
import { MonitorTable } from "@/pages/uptime/UptimeMonitorsTable";
import { InitializingStatusBox } from "@/components/design-elements/StatusBox";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import {
  type IMonitor,
  type IMonitorWithStats,
  type MonitorStatus,
  type UptimeMonitorType,
  UptimeMonitorTypes,
  MonitorStatuses,
} from "@/types/monitor";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState } from "react";
import { useDelete } from "@/hooks/UseApi";
import { config } from "@/config/index";
import { useLimitReached } from "@/hooks/UsePlanEntitlements";

const GLOBAL_REFRESH = config.GLOBAL_REFRESH;

const UptimeMonitors = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const [selectedMonitor, setSelectedMonitor] = useState<IMonitor | null>(null);
  const isDialogOpen = Boolean(selectedMonitor);
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTypes, setSelectedTypes] = useState<UptimeMonitorType[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<MonitorStatus[]>([]);
  const [searchString, setSearchString] = useState<string>("");

  const { deleteFn, loading: isDeleting } = useDelete();

  const typeFilter =
    selectedTypes.length > 0 ? selectedTypes : UptimeMonitorTypes;
  const typeQuery = typeFilter
    .map((type: UptimeMonitorType) => `type=${encodeURIComponent(type)}`)
    .join("&");

  const statusFilter =
    selectedStatuses.length > 0 ? selectedStatuses : MonitorStatuses;
  const statusQuery = statusFilter
    .map((status) => `status=${encodeURIComponent(status)}`)
    .join("&");

  const requestParams = [
    "embedChecks=true",
    typeQuery,
    statusQuery,
    `search=${searchString}`,
    `sortField=${sortField}`,
    `sortOrder=${sortOrder}`,
    `page=${page}`,
    `rowsPerPage=${rowsPerPage}`,
  ].filter(Boolean);
  const monitorRequestUrl = `/monitors?${requestParams.join("&")}`;

  const { response, loading, error, refetch } = useGet<
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

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    selectedStatuses.length > 0 ||
    searchString.trim() !== "";
  const showFallback = monitors.length === 0 && !hasActiveFilters;

  const monitorItems = showFallback
    ? []
    : monitors.length > 0
      ? monitors
      : [{}];

  return (
    <MonitorBasePageWithStates
      loading={loading}
      error={error}
      items={monitorItems}
      page="uptime"
      actionLink="/uptime/create"
      monitorLimitReached={monitorLimitReached}
    >
      <InfoBox
        title={t("monitors.uptime.infoBox.title")}
        description={t("monitors.uptime.infoBox.description")}
      />
      <HeaderCreate
        isLoading={loading}
        path="/uptime/create"
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
      <HeaderFilter
        selectedTypes={selectedTypes}
        selectedStatuses={selectedStatuses}
        onTypesChange={setSelectedTypes}
        onStatusesChange={setSelectedStatuses}
        searchString={searchString}
        onSearchStringChange={setSearchString}
        loading={loading}
      />
      <MonitorTable
        monitors={monitors}
        refetch={refetch}
        setSelectedMonitor={setSelectedMonitor}
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        count={count || 0}
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

export default UptimeMonitors;
