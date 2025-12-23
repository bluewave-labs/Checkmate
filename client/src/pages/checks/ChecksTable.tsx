import {
  Table,
  Pagination,
  ValueLabel,
  StatusLabel,
} from "@/components/design-elements";
import Box from "@mui/material/Box";
import type { Header } from "@/components/design-elements/Table";

import { useTranslation } from "react-i18next";
import { formatDateWithTz } from "@/utils/TimeUtils";
import { useAppSelector } from "@/hooks/AppHooks";
import type { ICheck } from "@/types/check";
import type { MonitorStatus } from "@/types/monitor";
import { useNavigate } from "react-router";

type CheckWithMonitor = ICheck & {
  metadata?: { monitorId?: { name?: string } };
};

export const ChecksTable = ({
  checks,
  hasMore,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
}: {
  checks: CheckWithMonitor[];
  hasMore?: boolean;
  page: number;
  setPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rowsPerPage: number) => void;
}) => {
  const { t } = useTranslation();
  const uiTimezone = useAppSelector((state: any) => state.ui.timezone);
  const navigate = useNavigate();

  const getHeaders = (t: Function, uiTimezone: string) => {
    const headers: Header<CheckWithMonitor>[] = [
      {
        id: "monitorName",
        content: t("common.table.headers.monitor"),
        render: (row) => {
          return row.metadata?.monitorId?.name || "N/A";
        },
      },
      {
        id: "status",
        content: "Status",
        render: (row) => {
          return <StatusLabel status={row.status as MonitorStatus} />;
        },
      },
      {
        id: "date",
        content: t("checks.table.headers.dateTime"),
        render: (row) => {
          return formatDateWithTz(
            row.createdAt,
            "ddd, MMMM D, YYYY, HH:mm A",
            uiTimezone
          );
        },
      },
      {
        id: "statusCode",
        content: t("checks.table.headers.statusCode"),
        render: (row) => {
          const code = row.httpStatusCode;
          const value =
            code < 300 ? "positive" : code < 400 ? "neutral" : "negative";
          return <ValueLabel value={value} text={String(code)} />;
        },
      },
      {
        id: "message",
        content: t("common.table.headers.message"),
        render: (row) => {
          return row.message || "N/A";
        },
      },
    ];
    return headers;
  };

  const headers = getHeaders(t, uiTimezone);

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

  return (
    <Box>
      <Table
        headers={headers}
        data={checks}
        onRowClick={(row) => {
          navigate(`/checks/${row._id}`);
        }}
        emptyViewText={t("checks.table.empty")}
      />
      <Pagination
        component="div"
        count={0}
        hasMore={hasMore}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Box>
  );
};
