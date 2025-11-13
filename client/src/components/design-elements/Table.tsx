import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Collapse from "@mui/material/Collapse";

import IconButton from "@mui/material/IconButton";
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import TablePagination from "@mui/material/TablePagination";
import type { TablePaginationProps } from "@mui/material/TablePagination";

import { useState, Fragment } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

export type Header<T> = {
  id: number | string;
  content: React.ReactNode;
  onClick?: (
    event: React.MouseEvent<HTMLTableCellElement | null>,
    row: T
  ) => void;
  render: (row: T) => React.ReactNode;
};

type DataTableProps<T extends { id?: string | number; _id?: string | number }> =
  {
    headers: Header<T>[];
    data: T[];
    onRowClick?: (row: T) => void;
    cardsOnSmallScreens?: boolean;
    expandableRows?: boolean;
    renderExpandedContent?: (row: T) => React.ReactNode;
  };

export function DataTable<
  T extends {
    id?: string | number;
    _id?: string | number;
    onRowClick?: (row: T) => void;
  }
>({
  headers,
  data,
  onRowClick,
  cardsOnSmallScreens = true,
  expandableRows = false,
  renderExpandedContent,
}: DataTableProps<T>) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<(string | number) | null>(null);
  const handleExpand = (row: T) => {
    const key = row.id || row._id || null;
    setExpanded(expanded === key ? null : key);
  };

  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  if (data.length === 0 || headers.length === 0) return <EmptyView />;

  const keys = [];
  // Return stack of cards for small screens
  if (isSmall && cardsOnSmallScreens) {
    return (
      <Stack spacing={theme.spacing(4)}>
        {data.map((row) => {
          const key = row.id || row._id || Math.random();
          keys.push(key);
          return (
            <Stack
              onClick={() => (onRowClick ? onRowClick(row) : null)}
              spacing={theme.spacing(4)}
              sx={{
                borderStyle: "solid",
                borderWidth: 1,
                borderColor: theme.palette.primary.lowContrast,
                borderRadius: theme.shape.borderRadius,
                padding: theme.spacing(4),
                cursor: onRowClick ? "pointer" : "default",
              }}
              key={key}
            >
              {headers.map((header) => {
                return (
                  <Grid container key={header.id}>
                    <Grid size={3} display={"flex"} alignItems={"center"}>
                      <Typography color={theme.palette.text.primary}>
                        {header.content}
                      </Typography>
                    </Grid>
                    <Grid size={9} display="flex" alignItems={"center"}>
                      {header.render(row)}{" "}
                    </Grid>
                  </Grid>
                );
              })}
              {expandableRows &&
                renderExpandedContent &&
                renderExpandedContent(row) && (
                  <Grid size={12}>{renderExpandedContent(row)}</Grid>
                )}
            </Stack>
          );
        })}
      </Stack>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ boxShadow: "none" }}>
      <Table
        sx={{
          "&.MuiTable-root  :is(.MuiTableHead-root, .MuiTableBody-root) :is(th, td)":
            {
              paddingLeft: theme.spacing(8),
            },
          "& .MuiTableHead-root .MuiTableRow-root": {
            height: "28px",
          },
          "& :is(th)": {
            backgroundColor: theme.palette.tertiary.main,
            color: theme.palette.secondary.contrastText,
            fontWeight: 500,
            textTransform: "uppercase",
            padding: `${theme.spacing(2)} ${theme.spacing(8)}`,
            fontSize: theme.typography.fontSize,
          },
          "& :is(td)": {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastTextSecondary,
            padding: `${theme.spacing(7)} ${theme.spacing(8)}`,
            fontSize: theme.typography.fontSize,
          },
          "& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root":
            {
              borderBottom: "none",
            },
        }}
      >
        <TableHead>
          <TableRow>
            {headers.map((header, idx) => {
              return (
                <TableCell
                  align={idx === 0 ? "left" : "center"}
                  key={header.id}
                >
                  {header.content}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => {
            const key = row.id || row._id || Math.random();
            const isExpanded = expanded === key;

            return (
              <Fragment key={key}>
                <TableRow
                  sx={{
                    cursor: onRowClick ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (expandableRows) handleExpand(row);
                    else if (onRowClick) onRowClick(row);
                  }}
                >
                  {headers.map((header, index) => {
                    return (
                      <TableCell
                        align={index === 0 ? "left" : "center"}
                        key={header.id}
                        onClick={
                          header.onClick
                            ? (e) => header.onClick!(e, row)
                            : undefined
                        }
                      >
                        {header.render(row)}
                      </TableCell>
                    );
                  })}
                </TableRow>
                {expandableRows &&
                  renderExpandedContent &&
                  renderExpandedContent(row) && (
                    <TableRow>
                      <TableCell
                        colSpan={headers.length}
                        style={{
                          borderBottom: isExpanded ? undefined : "none",
                          paddingTop: 0,
                          paddingBottom: 0,
                        }}
                      >
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ pt: 4, pb: 4 }}>
                            {renderExpandedContent(row)}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (
    event: React.MouseEvent<HTMLButtonElement>,
    newPage: number
  ) => void;
}

function TablePaginationActions(props: TablePaginationActionsProps) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }} className="table-pagination-actions">
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === "rtl" ? (
          <ChevronsRight size={20} strokeWidth={1.5} />
        ) : (
          <ChevronsLeft size={20} strokeWidth={1.5} />
        )}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === "rtl" ? (
          <ChevronRight size={20} strokeWidth={1.5} />
        ) : (
          <ChevronLeft size={20} strokeWidth={1.5} />
        )}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === "rtl" ? (
          <ChevronLeft size={20} strokeWidth={1.5} />
        ) : (
          <ChevronRight size={20} strokeWidth={1.5} />
        )}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === "rtl" ? (
          <ChevronsLeft size={20} strokeWidth={1.5} />
        ) : (
          <ChevronsRight size={20} strokeWidth={1.5} />
        )}
      </IconButton>
    </Box>
  );
}

export const Pagination: React.FC<TablePaginationProps> = ({ ...props }) => {
  const isSmall = useMediaQuery((theme: any) => theme.breakpoints.down("sm"));
  const theme = useTheme();
  return (
    <TablePagination
      ActionsComponent={TablePaginationActions}
      rowsPerPageOptions={[5, 10, 25]}
      {...props}
      sx={{
        "& .MuiTablePagination-toolbar": {
          display: isSmall ? "grid" : "flex",
        },
        "& .MuiTablePagination-selectLabel": {
          gridColumn: "1",
          gridRow: "1",
          justifySelf: "center",
        },
        "& .MuiTablePagination-select": {
          gridColumn: "2",
          gridRow: "1",
          justifySelf: "center",
        },
        "& .MuiTablePagination-displayedRows": {
          gridColumn: "2",
          gridRow: "2",
          justifySelf: "center	",
        },
        "& .table-pagination-actions": {
          gridColumn: "1",
          gridRow: "2",
          justifySelf: "center",
        },
        "& .MuiSelect-select": {
          border: 1,
          borderColor: theme.palette.primary.lowContrast,
          borderRadius: theme.shape.borderRadius,
        },
      }}
    />
  );
};

const EmptyView = () => {
  const theme = useTheme();
  return (
    <Stack
      alignItems={"center"}
      sx={{
        p: theme.spacing(4),
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: theme.palette.primary.lowContrast,
        borderRadius: theme.shape.borderRadius,
      }}
    >
      <Typography>No data</Typography>
    </Stack>
  );
};
