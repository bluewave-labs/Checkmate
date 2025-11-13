import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Table, Pagination, StatusLabel } from "@/components/design-elements";
import type { Header } from "@/components/design-elements/Table";
import { ActionsMenu } from "@/components/actions-menu";
import { Gauge } from "@/components/design-elements";

import { useTranslation } from "react-i18next";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { usePatch } from "@/hooks/UseApi";

import type { IMonitor } from "@/types/monitor";
import type { ActionMenuItem } from "@/components/actions-menu";

export const InfraMonitorsTable = ({
  monitors,
  refetch,
  setSelectedMonitor,
  count,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
}: {
  monitors: IMonitor[];
  refetch: Function;
  setSelectedMonitor: Function;
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

  const getActions = (monitor: IMonitor): ActionMenuItem[] => {
    return [
      {
        id: 1,
        label: "Open site",
        action: () => {
          window.open(monitor.url, "_blank", "noreferrer");
        },
        closeMenu: true,
      },
      {
        id: 2,
        label: "Details",
        action: () => {
          navigate(`${monitor._id}`);
        },
      },
      {
        id: 3,
        label: "Incidents",
        action: () => {
          navigate(`/incidents/${monitor._id}`);
        },
      },
      {
        id: 4,
        label: "Configure",
        action: () => {
          navigate(`/infrastructure/${monitor._id}/configure`);
        },
      },
      // {
      //   id: 5,
      //   label: "Clone",
      //   action: () => {
      //     console.log("Open clone");
      //   },
      // },
      {
        id: 6,
        label: monitor.isActive ? "Pause" : "Resume",
        action: async () => {
          await patch(`/monitors/${monitor._id}/active`);
          refetch();
        },
        closeMenu: true,
      },
      {
        id: 7,
        label: <Typography color={theme.palette.error.main}>Remove</Typography>,
        action: () => {
          setSelectedMonitor(monitor);
        },
        closeMenu: true,
      },
    ];
  };

  const getHeaders = () => {
    const headers: Header<IMonitor>[] = [
      {
        id: "name",
        content: t("host"),
        render: (row) => {
          return row.name;
        },
      },
      {
        id: "status",
        content: t("status"),
        render: (row) => {
          return <StatusLabel status={row.status} isActive={row.isActive} />;
        },
      },
      {
        id: "cpu",
        content: t("cpu"),
        render: (row) => {
          const cpuUsage =
            (row.latestChecks?.[0]?.system?.cpu?.usage_percent || 0) * 100;
          return <Gauge progress={cpuUsage} />;
        },
      },
      {
        id: "memory",
        content: t("memory"),
        render: (row) => {
          const memoryUsage =
            (row.latestChecks?.[0]?.system?.memory?.usage_percent || 0) * 100;
          return <Gauge progress={memoryUsage} />;
        },
      },
      {
        id: "disk",
        content: t("disk"),
        render: (row) => {
          const totalDiskUsage = row.latestChecks?.[0]?.system?.disk.reduce(
            (acc, disk) => acc + disk.usage_percent,
            0
          );
          const diskCount = row.latestChecks?.[0]?.system?.disk.length || 1;
          const diskUsage = ((totalDiskUsage || 0) / diskCount) * 100;
          return <Gauge progress={diskUsage} />;
        },
      },

      {
        id: "actions",
        content: t("actions"),
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
          navigate(`/infrastructure/${row._id}`);
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
