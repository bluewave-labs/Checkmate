import { Table, Pagination, ValueLabel } from "@/components/design-elements";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Button } from "@/components/inputs";
import type { Header } from "@/components/design-elements/Table";

import { usePatch } from "@/hooks/UseApi";
import { useTranslation } from "react-i18next";
import { formatDateWithTz } from "@/utils/TimeUtils";
import { useAppSelector } from "@/hooks/AppHooks";
import type { IIncident } from "@/types/incident";

export const IncidentTable = ({
  incidents,
  count,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  refetch,
}: {
  incidents: IIncident[];
  count: number;
  page: number;
  setPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rowsPerPage: number) => void;
  refetch: () => void;
}) => {
  const { patch, loading: isPatching } = usePatch();
  const { t } = useTranslation();
  const uiTimezone = useAppSelector((state: any) => state.ui.timezone);

  const getHeaders = (t: Function, uiTimezone: string) => {
    const headers: Header<IIncident>[] = [
      {
        id: "name",
        content: t("incidentsTableMonitorName"),
        render: (row) => {
          return row.monitorId.name || "N/A";
        },
      },
      {
        id: "start",
        content: "Incident start",
        render: (row) => {
          return formatDateWithTz(
            row.startedAt,
            "ddd, MMMM D, YYYY, HH:mm A",
            uiTimezone
          );
        },
      },
      {
        id: "end",
        content: "Incident end",
        render: (row) => {
          return row.endedAt
            ? formatDateWithTz(
                row.endedAt,
                "ddd, MMMM D, YYYY, HH:mm A",
                uiTimezone
              )
            : "Ongoing";
        },
      },
      {
        id: "status",
        content: "Current monitor status",
        render: (row) => {
          return (
            <Typography textTransform={"capitalize"} color="textPrimary">
              {row.monitorId.status}
            </Typography>
          );
        },
      },
      {
        id: "resolved",
        content: "Resolved",
        render: (row) => {
          return (
            <ValueLabel
              value={row.resolved ? "positive" : "negative"}
              text={row.resolved ? "Yes" : "No"}
            />
          );
        },
      },
      {
        id: "resolutionType",
        content: "Resolution type",
        render: (row) => {
          return row.resolutionType || "N/A";
        },
      },
      {
        id: "resolvedBy",
        content: "Resolved by",
        render: (row) => {
          return row.resolvedBy?.email || "N/A";
        },
      },
      {
        id: "actions",
        content: "Actions",
        render: (row) => {
          return row.resolved ? null : (
            <Button
              onClick={async (e) => {
                e.stopPropagation();
                await patch(`/incidents/${row._id}/resolve`, {
                  resolutionNote: "Resolved via UI",
                });
                refetch();
              }}
              variant="contained"
              color="accent"
            >
              Resolve
            </Button>
          );
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
        data={incidents}
        onRowClick={(row) => {
          alert(JSON.stringify(row, null, 2));
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
