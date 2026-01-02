import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Table, Pagination, StatusLabel } from "@/components/design-elements";
import type { Header } from "@/components/design-elements/Table";
import { ActionsMenu } from "@/components/actions-menu";
import { Gauge } from "@/components/design-elements";
import { ArrowUp, ArrowDown } from "lucide-react";

import { useTranslation } from "react-i18next";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { usePatch } from "@/hooks/UseApi";

import type { ICheck } from "@/types/check";
import type { IMonitor } from "@/types/monitor";
import type { ActionMenuItem } from "@/components/actions-menu";

export const InfraMonitorsTable = ({
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
  checksMap: Record<string, ICheck[]>;
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
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
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
          navigate(`/infrastructure/${monitor.id}/configure`);
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

  const getHeaders = () => {
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
          <Typography
            component="div"
            display="inline-flex"
            alignItems="center"
            gap={theme.spacing(4)}
            onClick={(e) => handleSort(e, "name")}
            sx={{ cursor: "pointer" }}
          >
            {t("common.table.headers.name")}
            {renderSortIcon(sortField === "name")}
          </Typography>
        ),
        render: (row) => {
          return row.name;
        },
      },
      {
        id: "status",
        content: (
          <Typography
            component="div"
            display="inline-flex"
            alignItems="center"
            gap={theme.spacing(4)}
            onClick={(e) => handleSort(e, "status")}
            sx={{ cursor: "pointer" }}
          >
            {t("common.table.headers.status")}
            {renderSortIcon(sortField === "status")}
          </Typography>
        ),
        render: (row) => {
          return (
            <StatusLabel
              status={(row.status as any) ?? ("initializing" as any)}
            />
          );
        },
      },
      {
        id: "cpu",
        content: t("monitors.infrastructure.table.headers.cpu"),
        render: (row) => {
          const cpuUsage =
            (checksMap[row.id]?.[0]?.system?.cpu?.usage_percent || 0) * 100;
          return <Gauge progress={cpuUsage} />;
        },
      },
      {
        id: "memory",
        content: t("monitors.infrastructure.table.headers.memory"),
        render: (row) => {
          const memoryUsage =
            (checksMap[row.id]?.[0]?.system?.memory?.usage_percent || 0) * 100;
          return <Gauge progress={memoryUsage} />;
        },
      },
      {
        id: "disk",
        content: t("monitors.infrastructure.table.headers.disk"),
        render: (row) => {
          const totalDiskUsage = checksMap[row.id]?.[0]?.system?.disk?.reduce(
            (acc, disk) => acc + disk.usage_percent,
            0
          );
          const diskCount = checksMap[row.id]?.[0]?.system?.disk?.length || 1;
          const diskUsage = ((totalDiskUsage || 0) / diskCount) * 100;
          return <Gauge progress={diskUsage} />;
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

  let headers = getHeaders();

  if (isSmall) {
    headers = headers.filter((h) => h.id !== "histogram");
  }
  return (
    <Box>
      <Table
        headers={headers}
        data={monitors}
        onRowClick={(row) => {
          navigate(`/infrastructure/${row.id}`);
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
