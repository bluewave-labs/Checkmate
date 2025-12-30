import Typography from "@mui/material/Typography";
import { Table, Pagination, StatusLabel } from "@/components/design-elements";
import { ActionsMenu } from "@/components/actions-menu";
import { usePatch } from "@/hooks/UseApi";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import type { Header } from "@/components/design-elements/Table";
import type { IMonitor } from "@/types/monitor";
import { useTranslation } from "react-i18next";

export const DockerMonitorsTable = ({
  monitors,
  count,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  refetch,
  setSelectedMonitor,
}: {
  monitors: IMonitor[];
  count: number;
  page: number;
  setPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rowsPerPage: number) => void;
  refetch: Function;
  setSelectedMonitor: Function;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { patch } = usePatch<any, IMonitor>();
  const handlePageChange = (
    _e: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => setPage(newPage);

  const handleRowsPerPageChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setPage(0);
    setRowsPerPage(Number(e.target.value));
  };

  const getActions = (monitor: IMonitor) => [
    {
      id: 1,
      label: t("monitors.common.actions.openSite"),
      action: () => window.open(monitor.url, "_blank", "noreferrer"),
      closeMenu: true,
    },
    {
      id: 2,
      label: t("monitors.common.actions.details"),
      action: () => navigate(`/docker/${monitor._id}`),
    },
    {
      id: 3,
      label: t("monitors.common.actions.incidents"),
      action: () => navigate(`/incidents?monitorId=${monitor._id}`),
    },
    {
      id: 4,
      label: t("monitors.common.actions.configure"),
      action: () => navigate(`/docker/${monitor._id}/configure`),
    },
    {
      id: 6,
      label:
        monitor.status === "paused"
          ? t("common.buttons.resume")
          : t("common.buttons.pause"),
      action: async () => {
        await patch(`/monitors/${monitor._id}/active`);
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
      action: () => setSelectedMonitor(monitor),
      closeMenu: true,
    },
  ];

  const headers: Header<IMonitor>[] = [
    {
      id: "name",
      content: (
        <Typography component="div">
          {t("common.table.headers.name")}
        </Typography>
      ),
      render: (row) => row.name,
    },
    {
      id: "status",
      content: (
        <Typography component="div">
          {t("common.table.headers.status")}
        </Typography>
      ),
      render: (row) => <StatusLabel status={row.status} />,
    },
    {
      id: "runningContainers",
      content: (
        <Typography component="div">
          {t("monitors.docker.table.headers.runningContainers")}
        </Typography>
      ),
      render: (row) => {
        const containerCount = (row.latestChecks?.[0]?.dockerContainers || [])
          .length;
        return containerCount;
      },
    },
    {
      id: "actions",
      content: (
        <Typography component="div">
          {t("common.table.headers.actions")}
        </Typography>
      ),
      render: (row) => <ActionsMenu items={getActions(row)} />,
    },
  ];

  return (
    <>
      <Table
        headers={headers}
        data={monitors}
        onRowClick={(row) => navigate(`/docker/${row._id}`)}
      />
      <Pagination
        component="div"
        count={count}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </>
  );
};
