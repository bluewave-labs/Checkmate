import Stack from "@mui/material/Stack";
import Grid2 from "@mui/material/Grid";
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
import Tooltip from "@mui/material/Tooltip";

import IconButton from "@mui/material/IconButton";
import {
	ChevronsLeft,
	ChevronsRight,
	ChevronLeft,
	ChevronRight,
	Ellipsis,
} from "lucide-react";
import { EmptyState } from "./EmptyState";

import TablePagination from "@mui/material/TablePagination";
import type { TablePaginationOwnProps } from "@mui/material/TablePagination";

import { useTranslation } from "react-i18next";
import { useState, Fragment, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { SPACING, LAYOUT } from "@/Utils/Theme/constants";
import type { SxProps, Theme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

export type Header<T> = {
	id: number | string;
	content: React.ReactNode;
	onClick?: (event: React.MouseEvent<HTMLTableCellElement | null>, row: T) => void;
	render: (row: T) => React.ReactNode;
};

type DataTableProps<T extends { id?: string | number; _id?: string | number }> = {
	headers: Header<T>[];
	data: T[];
	onRowClick?: (row: T) => void;
	cardsOnSmallScreens?: boolean;
	expandableRows?: boolean;
	renderExpandedContent?: (row: T) => React.ReactNode;
	emptyViewText?: string;
	emptyViewPositive?: boolean;
	getRowSx?: (row: T) => SxProps<Theme>;
};

export function DataTable<
	T extends {
		id?: string | number;
		_id?: string | number;
		onRowClick?: (row: T) => void;
	},
>({
	headers,
	data,
	onRowClick,
	cardsOnSmallScreens = true,
	expandableRows = false,
	renderExpandedContent,
	emptyViewText,
	emptyViewPositive,
	getRowSx,
}: DataTableProps<T>) {
	const theme = useTheme();
	const [expanded, setExpanded] = useState<(string | number) | null>(null);
	const handleExpand = (row: T) => {
		const key = row.id || row._id || null;
		setExpanded(expanded === key ? null : key);
	};

	const isSmall = useMediaQuery(theme.breakpoints.down("md"));

	if (data.length === 0 || headers.length === 0) {
		return (
			<EmptyView
				text={emptyViewText}
				positive={emptyViewPositive}
			/>
		);
	}

	const keys = [];
	// Return stack of cards for small screens
	if (isSmall && cardsOnSmallScreens) {
		return (
			<Stack spacing={theme.spacing(LAYOUT.XS)}>
				{data.map((row) => {
					const key = row.id || row._id || Math.random();
					keys.push(key);
					return (
						<Stack
							onClick={() => (onRowClick ? onRowClick(row) : null)}
							spacing={theme.spacing(LAYOUT.XS)}
							sx={{
								borderStyle: "solid",
								borderWidth: 1,
								borderColor: theme.palette.divider,
								borderRadius: theme.shape.borderRadius,
								padding: theme.spacing(LAYOUT.XS),
								cursor: onRowClick ? "pointer" : "default",
							}}
							key={key}
						>
							{headers.map((header) => {
								return (
									<Grid2
										container
										key={header.id}
									>
										<Grid2
											size={5}
											display={"flex"}
											alignItems={"center"}
										>
											<Typography
												component="div"
												color={theme.palette.text.primary}
											>
												{header.content}
											</Typography>
										</Grid2>
										<Grid2
											size={7}
											display="flex"
											alignItems={"center"}
										>
											{header.render(row)}{" "}
										</Grid2>
									</Grid2>
								);
							})}
							{expandableRows && renderExpandedContent && renderExpandedContent(row) && (
								<Grid2 size={12}>{renderExpandedContent(row)}</Grid2>
							)}
						</Stack>
					);
				})}
			</Stack>
		);
	}

	return (
		<TableContainer
			component={Paper}
			elevation={0}
			sx={{ boxShadow: "none", overflowX: "hidden" }}
		>
			<Table
				sx={{
					"&.MuiTable-root  :is(.MuiTableHead-root, .MuiTableBody-root) :is(th, td)": {
						paddingLeft: theme.spacing(LAYOUT.MD),
					},
					"& .MuiTableCell-root": {
						borderBottom: `1px solid ${theme.palette.divider}`,
					},
					"& .MuiTableHead-root .MuiTableRow-root": {
						height: "28px",
						borderBottom: `1px solid ${theme.palette.divider}`,
					},
					"& .MuiTableHead-root .MuiTableCell-root": {
						borderBottom: "none",
					},
					"& :is(th)": {
						backgroundColor: theme.palette.background.paper,
						color: theme.palette.text.secondary,
						fontWeight: 500,
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						padding: `${theme.spacing(SPACING.LG)} ${theme.spacing(LAYOUT.MD)}`,
						fontSize: 11,
					},
					"& :is(td)": {
						backgroundColor: theme.palette.background.paper,
						color: theme.palette.text.secondary,
						padding: `${theme.spacing(LAYOUT.MD)} ${theme.spacing(LAYOUT.MD)}`,
						fontSize: theme.typography.fontSize,
						overflowX: "hidden",
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
						const isExpanded = expanded === key;

						return (
							<Fragment key={key}>
								<TableRow
									sx={{
										cursor: onRowClick ? "pointer" : "default",
										...(getRowSx?.(row) as object),
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
													header.onClick ? (e) => header.onClick!(e, row) : undefined
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
												<Collapse
													in={isExpanded}
													timeout="auto"
													unmountOnExit
												>
													<Box sx={{ pt: 4, pb: 4 }}>{renderExpandedContent(row)}</Box>
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
			sx={{ flexShrink: 0, ml: { xs: 0, md: 2.5 } }}
			className="table-pagination-actions"
		>
			<IconButton
				onClick={handleFirstPageButtonClick}
				disabled={page === 0}
				aria-label="first page"
			>
				{theme.direction === "rtl" ? (
					<ChevronsRight
						size={20}
						strokeWidth={1.5}
					/>
				) : (
					<ChevronsLeft
						size={20}
						strokeWidth={1.5}
					/>
				)}
			</IconButton>
			<IconButton
				onClick={handleBackButtonClick}
				disabled={page === 0}
				aria-label="previous page"
			>
				{theme.direction === "rtl" ? (
					<ChevronRight
						size={20}
						strokeWidth={1.5}
					/>
				) : (
					<ChevronLeft
						size={20}
						strokeWidth={1.5}
					/>
				)}
			</IconButton>
			<IconButton
				onClick={handleNextButtonClick}
				disabled={page >= Math.ceil(count / rowsPerPage) - 1}
				aria-label="next page"
			>
				{theme.direction === "rtl" ? (
					<ChevronLeft
						size={20}
						strokeWidth={1.5}
					/>
				) : (
					<ChevronRight
						size={20}
						strokeWidth={1.5}
					/>
				)}
			</IconButton>
			<IconButton
				onClick={handleLastPageButtonClick}
				disabled={page >= Math.ceil(count / rowsPerPage) - 1}
				aria-label="last page"
			>
				{theme.direction === "rtl" ? (
					<ChevronsLeft
						size={20}
						strokeWidth={1.5}
					/>
				) : (
					<ChevronsRight
						size={20}
						strokeWidth={1.5}
					/>
				)}
			</IconButton>
		</Box>
	);
}

interface HasMoreTablePaginationActionsProps {
	hasMore?: boolean;
	page: number;
	onPageChange: (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => void;
}
function HasMoreTablePaginationActions(props: HasMoreTablePaginationActionsProps) {
	const theme = useTheme();
	const { hasMore, page, onPageChange } = props;

	const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		onPageChange(event, 0);
	};

	const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		onPageChange(event, page - 1);
	};

	const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		onPageChange(event, page + 1);
	};

	return (
		<Box
			sx={{ flexShrink: 0, ml: { xs: 0, md: 2.5 } }}
			className="table-pagination-actions"
		>
			<IconButton
				onClick={handleFirstPageButtonClick}
				disabled={page === 0}
				aria-label="first page"
			>
				{theme.direction === "rtl" ? (
					<ChevronsRight
						size={20}
						strokeWidth={1.5}
					/>
				) : (
					<ChevronsLeft
						size={20}
						strokeWidth={1.5}
					/>
				)}
			</IconButton>
			<IconButton
				onClick={handleBackButtonClick}
				disabled={page === 0}
				aria-label="previous page"
			>
				{theme.direction === "rtl" ? (
					<ChevronRight
						size={20}
						strokeWidth={1.5}
					/>
				) : (
					<ChevronLeft
						size={20}
						strokeWidth={1.5}
					/>
				)}
			</IconButton>
			<IconButton
				onClick={handleNextButtonClick}
				disabled={hasMore === false}
				aria-label="next page"
			>
				{theme.direction === "rtl" ? (
					<ChevronLeft
						size={20}
						strokeWidth={1.5}
					/>
				) : (
					<ChevronRight
						size={20}
						strokeWidth={1.5}
					/>
				)}
			</IconButton>
			<Tooltip title={hasMore === true ? "More pages available" : "No more pages"}>
				<IconButton
					disabled={hasMore === false}
					aria-label="next page"
				>
					<Ellipsis
						size={20}
						strokeWidth={1.5}
					/>
				</IconButton>
			</Tooltip>
		</Box>
	);
}

interface PaginationProps extends TablePaginationOwnProps {
	component?: React.ElementType;
	hasMore?: boolean;
	itemsOnPage?: number;
}

export const Pagination = ({ ...props }: PaginationProps) => {
	const { hasMore, itemsOnPage, ...rest } = props;
	const isSmall = useMediaQuery((theme: any) => theme.breakpoints.down("sm"));
	const theme = useTheme();

	useEffect(() => {
		if (
			typeof itemsOnPage === "number" &&
			itemsOnPage === 0 &&
			rest.count > 0 &&
			rest.page > 0 &&
			rest.onPageChange
		) {
			rest.onPageChange(null, rest.page - 1);
		}
	}, [itemsOnPage, rest.count, rest.page, rest.onPageChange]);

	const labelDisplayedRows = ({
		from,
		to,
		count,
	}: {
		from: number;
		to: number;
		count: number;
	}) => {
		if (hasMore) {
			return to === 0 ? "" : `${from}–${to}`;
		}
		return `${from}–${to} of ${count}`;
	};

	return (
		<TablePagination
			ActionsComponent={(props) =>
				typeof hasMore === "boolean" ? (
					<HasMoreTablePaginationActions
						{...props}
						hasMore={hasMore}
					/>
				) : (
					<TablePaginationActions {...props} />
				)
			}
			rowsPerPageOptions={[5, 10, 25]}
			labelDisplayedRows={labelDisplayedRows}
			{...rest}
			sx={{
				"& .MuiTablePagination-toolbar": isSmall
					? {
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gridAutoRows: "auto",
							rowGap: theme.spacing(SPACING.SM),
							alignItems: "center",
							justifyItems: "center",
							paddingLeft: 0,
							paddingRight: 0,
						}
					: { display: "flex", alignItems: "center" },
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
				"& .MuiTablePagination-displayedRows": isSmall
					? { gridColumn: "1 / span 2", gridRow: "2", justifySelf: "center" }
					: {},
				"& .table-pagination-actions": isSmall
					? { gridColumn: "1 / span 2", gridRow: "3", justifySelf: "center" }
					: {},
				"& .MuiSelect-select": {
					border: 1,
					borderColor: theme.palette.divider,
					borderRadius: theme.shape.borderRadius,
				},
			}}
		/>
	);
};

const EmptyView = ({ text }: { text?: string; positive?: boolean }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	return (
		<Box
			sx={{
				border: `1px solid ${theme.palette.divider}`,
				borderRadius: 1,
				backgroundColor: theme.palette.background.paper,
			}}
		>
			<EmptyState title={text ?? t("common.table.empty")} />
		</Box>
	);
};
