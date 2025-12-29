import Typography from "@mui/material/Typography";
import { Table, Pagination, StatusLabel } from "@/components/design-elements";
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
}: {
  monitors: IMonitor[];
  count: number;
  page: number;
  setPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rowsPerPage: number) => void;
}) => {
  const { t } = useTranslation();

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

  const headers: Header<IMonitor>[] = [
    {
      id: "name",
      content: (
        <Typography component="div">{t("common.table.headers.name")}</Typography>
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
  ];

  return (
    <>
      <Table headers={headers} data={monitors} />
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
