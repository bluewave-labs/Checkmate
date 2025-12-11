import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { Table, Pagination } from "@/components/design-elements";
import { ActionsMenu } from "@/components/actions-menu";

import type { Header } from "@/components/design-elements/Table";
import { useNavigate } from "react-router";
import type { IStatusPage } from "@/types/status-page";
import type { ActionMenuItem } from "@/components/actions-menu";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

export const StatusPageTable = ({
  statusPages,
  setSelectedStatusPage,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  count,
}: {
  statusPages: IStatusPage[];
  setSelectedStatusPage: (statusPage: IStatusPage) => void;
  page: number;
  setPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rowsPerPage: number) => void;
  count: number;
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  const getActions = (statusPage: IStatusPage): ActionMenuItem[] => {
    return [
      {
        id: 1,
        label: "Configure",
        action: () => {
          navigate(`/status-pages/${statusPage._id}/configure`);
        },
        closeMenu: true,
      },
      {
        id: 7,
        label: <Typography color={theme.palette.error.main}>Remove</Typography>,
        action: async () => {
          setSelectedStatusPage(statusPage);
        },
        closeMenu: true,
      },
    ];
  };

  const getHeaders = () => {
    const headers: Header<IStatusPage>[] = [
      {
        id: "name",
        content: "Name",
        render: (row) => {
          return <Typography>{row?.name}</Typography>;
        },
      },
      {
        id: "published",
        content: "Published",
        render: (row) => {
          const published = row.isPublished ? "Yes" : "No";
          return <Typography>{published}</Typography>;
        },
      },
      {
        id: "url",
        content: "Public URL",
        render: (row) => {
          return (
            <Typography textTransform={"capitalize"}>{row?.url}</Typography>
          );
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

  const headers = getHeaders();
  return (
    <Box>
      <Table
        headers={headers}
        data={statusPages}
        onRowClick={(row) => {
          navigate(`/status-pages/${row._id}`);
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
