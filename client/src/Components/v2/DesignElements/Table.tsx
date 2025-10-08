import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import IconButton from "@mui/material/IconButton";
import LastPageIcon from "@mui/icons-material/LastPage";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";

import Box from "@mui/material/Box";
import TablePagination from "@mui/material/TablePagination";
import type { TablePaginationProps } from "@mui/material/TablePagination";

import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
export type Header<T> = {
	id: number | string;
	content: React.ReactNode;
	onClick?: (event: React.MouseEvent<HTMLTableCellElement | null>, row: T) => void;
	render: (row: T) => React.ReactNode;
};

type DataTableProps<T extends { id?: string | number; _id?: string | number }> = {
	headers: Header<T>[];
	data: T[];
};

export function DataTable<T extends { id?: string | number; _id?: string | number }>({
	headers,
	data,
}: DataTableProps<T>) {
	const theme = useTheme();
	if (data.length === 0 || headers.length === 0) return <div>No data</div>;
	return (
		<TableContainer component={Paper}>
			<Table
				stickyHeader
				sx={{
					"&.MuiTable-root  :is(.MuiTableHead-root, .MuiTableBody-root) :is(th, td)": {
						paddingLeft: theme.spacing(8),
					},
					"& :is(th)": {
						backgroundColor: theme.palette.secondary.main,
						color: theme.palette.secondary.contrastText,
						fontWeight: 600,
					},
					"& :is(td)": {
						backgroundColor: theme.palette.primary.main,
						color: theme.palette.primary.contrastTextSecondary,
					},
					"& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root": {
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

						return (
							<TableRow key={key}>
								{headers.map((header, index) => {
									return (
										<TableCell
											align={index === 0 ? "left" : "center"}
											key={header.id}
											onClick={
												header.onClick ? (e) => header.onClick!(e, row) : undefined
											}
										>
											{header.render(row)}
										</TableCell>
									);
								})}
							</TableRow>
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
	onPageChange: (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => void;
}

function TablePaginationActions(props: TablePaginationActionsProps) {
	const theme = useTheme();
	const { count, page, rowsPerPage, onPageChange } = props;

	const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		onPageChange(event, 0);
	};

	const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		onPageChange(event, page - 1);
	};

	const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		onPageChange(event, page + 1);
	};

	const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
	};

	return (
		<Box
			sx={{ flexShrink: 0, ml: 2.5 }}
			className="table-pagination-actions"
		>
			<IconButton
				onClick={handleFirstPageButtonClick}
				disabled={page === 0}
				aria-label="first page"
			>
				{theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
			</IconButton>
			<IconButton
				onClick={handleBackButtonClick}
				disabled={page === 0}
				aria-label="previous page"
			>
				{theme.direction === "rtl" ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
			</IconButton>
			<IconButton
				onClick={handleNextButtonClick}
				disabled={page >= Math.ceil(count / rowsPerPage) - 1}
				aria-label="next page"
			>
				{theme.direction === "rtl" ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
			</IconButton>
			<IconButton
				onClick={handleLastPageButtonClick}
				disabled={page >= Math.ceil(count / rowsPerPage) - 1}
				aria-label="last page"
			>
				{theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
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
