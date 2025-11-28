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
import { MonitorTable } from "@/pages/uptime/MonitorTable";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
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
import { InitializingStatusBox } from "@/components/design-elements/StatusBox";

const GLOBAL_REFRESH = import.meta.env.VITE_APP_GLOBAL_REFRESH;

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
      loading={isValidating}
      error={error}
      items={monitorItems}
      page="uptime"
      actionLink="/uptime/create"
    >
      <InfoBox
        title="Website & API Uptime Monitoring"
        description="Monitor your websites and APIs to ensure they're always accessible. Get instant alerts when your services go down and track uptime history over time."
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
      />
      <MonitorTable
        monitors={monitors}
        refetch={refetch}
        setSelectedMonitor={setSelectedMonitor}
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        count={monitors?.length || 0}
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
        loading={isDeleting}
      />
    </MonitorBasePageWithStates>
  );
};

export default UptimeMonitors;
