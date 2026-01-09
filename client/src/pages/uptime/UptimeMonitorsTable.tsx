import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Table, Pagination, StatusLabel, TypeChip } from "@/components/design-elements";
import { HeatmapResponseTime } from "@/components/common/HeatmapResponseTime";
import { HistogramResponseTime } from "@/components/common/HistogramResponseTime";
import type { Header } from "@/components/design-elements/Table";
import { ActionsMenu } from "@/components/actions-menu";
import { ArrowDown, ArrowUp } from "lucide-react";

import { useAppSelector } from "@/hooks/AppHooks";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { usePatch } from "@/hooks/UseApi";

import type { Check } from "@/types/check";
import type { IMonitor } from "@/types/monitor";
import type { ActionMenuItem } from "@/components/actions-menu";
import type { ChartType } from "@/features/uiSlice";

export const MonitorTable = ({
  monitors,
  checksMap,
  refetch,
  setSelectedMonitor,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  count,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
}: {
  monitors: IMonitor[];
  checksMap: Record<string, Check[]>;
  refetch: Function;
  setSelectedMonitor: Function;
  sortField: string;
  setSortField: (field: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
  count: number;
  page: number;
  setPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rowsPerPage: number) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const chartType = useAppSelector(
    (state) => state?.ui?.chartType || "heatmap"
  );
  const {
    patch,
    // loading: isPatching,
    // error: postError,
  } = usePatch<any, IMonitor>();

  const handlePageChange = (
    _e: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const value = Number(e.target.value);
    setPage(0);
    setRowsPerPage(value);
  };

  const handleSort = (e: any, field: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (sortField === field) {
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(newOrder);
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    refetch();
  };

  const getActions = (monitor: IMonitor): ActionMenuItem[] => {
    return [
      {
        id: 1,
        label: t("monitors.common.actions.openSite"),
        action: () => {
          window.open(monitor.url, "_blank", "noreferrer");
        },
        closeMenu: true,
      },
      {
        id: 2,
        label: t("monitors.common.actions.details"),
        action: () => {
          navigate(`${monitor.id}`);
        },
      },
      {
        id: 3,
        label: t("monitors.common.actions.incidents"),
        action: () => {
          navigate(`/incidents?monitorId=${monitor.id}`);
        },
      },
      {
        id: 4,
        label: t("monitors.common.actions.configure"),
        action: () => {
          navigate(`/uptime/${monitor.id}/configure`);
        },
      },
      // {
      //   id: 5,
      //   label: "Clone",
      //   action: () => {

      //   },
      // },
      {
        id: 6,
        label:
          monitor.status === "paused"
            ? t("common.buttons.resume")
            : t("common.buttons.pause"),
        action: async () => {
          await patch(`/monitors/${monitor.id}/active`);
          refetch();
        },
        closeMenu: true,
      },
      {
        id: 7,
        label: (
          <Typography color={theme.palette.error.main}>
            {t("common.buttons.delete")}
          </Typography>
        ),
        action: () => {
          setSelectedMonitor(monitor);
        },
        closeMenu: true,
      },
    ];
  };

  const getHeaders = (chartType: ChartType) => {
    const renderSortIcon = (isActive: boolean) => (
      <Box width={16} display="inline-flex" justifyContent="center">
        {isActive ? (
          sortOrder === "asc" ? (
            <ArrowUp size={16} />
          ) : (
            <ArrowDown size={16} />
          )
        ) : null}
      </Box>
    );
    const headers: Header<IMonitor>[] = [
      {
        id: "name",
        content: (
          <Stack
            gap={theme.spacing(4)}
            direction={"row"}
            alignItems={"center"}
            onClick={(e) => handleSort(e, "name")}
            sx={{ cursor: "pointer" }}
          >
            {t("common.table.headers.name")}
            {renderSortIcon(sortField === "name")}
          </Stack>
        ),

        render: (row) => {
          return row?.name;
        },
      },
      {
        id: "status",
        content: (
          <Stack
            gap={theme.spacing(4)}
            direction={"row"}
            justifyContent={"center"}
            alignItems={"center"}
            onClick={(e) => handleSort(e, "status")}
            sx={{ cursor: "pointer" }}
          >
            {t("common.table.headers.status")}
            {renderSortIcon(sortField === "status")}
          </Stack>
        ),
        render: (row) => {
          return <StatusLabel status={row.status} />;
        },
      },
      {
        id: "histogram",
        content: t("monitors.uptime.table.headers.responseTime"),
        render: (row) => {
          if (chartType === "histogram") {
            return <HistogramResponseTime checks={checksMap[row.id] ?? []} />;
          } else {
            return <HeatmapResponseTime checks={checksMap[row.id] ?? []} />;
          }
        },
      },
      {
        id: "type",
        content: (
          <Stack
            gap={theme.spacing(4)}
            direction={"row"}
            justifyContent={"center"}
            alignItems={"center"}
            onClick={(e) => handleSort(e, "type")}
            sx={{ cursor: "pointer" }}
          >
            {t("common.table.headers.type")}
            {renderSortIcon(sortField === "type")}
          </Stack>
        ),
        render: (row) => {
          return <TypeChip type={row.type} />;
        },
      },
      {
        id: "actions",
        content: t("common.table.headers.actions"),
        render: (row) => {
          return <ActionsMenu items={getActions(row)} />;
        },
      },
    ];
    return headers;
  };

  const headers = getHeaders(chartType);

  return (
    <Box>
      <Table
        headers={headers}
        data={monitors}
        onRowClick={(row) => {
          navigate(`/uptime/${row.id}`);
        }}
      />
      <Pagination
        component="div"
        count={count}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Box>
  );
};
