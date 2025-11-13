import { Table, Pagination, StatusLabel } from "@/components/design-elements";
import Box from "@mui/material/Box";

import type { Header } from "@/components/design-elements/Table";
import type { ICheck, IChecksWithCount } from "@/types/check";
import type { ApiResponse } from "@/hooks/UseApi";
import type { MonitorStatus } from "@/types/monitor";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGet } from "@/hooks/UseApi";
import { formatDateWithTz } from "@/utils/TimeUtils";
import { useAppSelector } from "@/hooks/AppHooks";

const getHeaders = (t: Function, uiTimezone: string) => {
  const headers: Header<ICheck>[] = [
    {
      id: "status",
      content: t("status"),
      render: (row) => {
        return <StatusLabel status={row.status as MonitorStatus} />;
      },
    },
    {
      id: "date",
      content: t("date&Time"),
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
      content: t("statusCode"),
      render: (row) => {
        return row.httpStatusCode || "N/A";
      },
    },
  ];
  return headers;
};

export const CheckTable = ({ monitorId }: { monitorId: string }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const { t } = useTranslation();
  const uiTimezone = useAppSelector((state: any) => state.ui.timezone);
  const headers = getHeaders(t, uiTimezone);

  const { response, error } = useGet<ApiResponse<IChecksWithCount>>(
    `/monitors/${monitorId}/checks?page=${page}&rowsPerPage=${rowsPerPage}`,
    {},
    { keepPreviousData: true }
  );

  const checks = response?.data?.checks || [];
  const count = response?.data?.count || 0;

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

  if (error) {
    console.error(error);
  }

  return (
    <Box>
      <Table headers={headers} data={checks} />
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
