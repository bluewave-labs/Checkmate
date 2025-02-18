import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { Stack, TablePagination, Typography } from "@mui/material";
import { TablePaginationActions } from "./Actions";
import SelectorVertical from "../../../assets/icons/selector-vertical.svg?react";

Pagination.propTypes = {
	paginationLabel: PropTypes.string, // Label for the pagination.
	itemCount: PropTypes.number, // Total number of items for pagination.
	page: PropTypes.number, // Current page index.
	rowsPerPage: PropTypes.number, // Number of rows displayed per page.
	handleChangePage: PropTypes.func.isRequired, // Function to handle page changes.
	handleChangeRowsPerPage: PropTypes.func, // Function to handle changes in rows per page.
};

const ROWS_PER_PAGE_OPTIONS = [5, 10, 15, 25];

/**
 * Pagination component for table navigation with customized styling and behavior.
 *
 * @param {object} props - Component properties.
 * @param {string} props.paginationLabel - Label for the pagination.
 * @param {number} props.monitorCount - Total number of monitors to paginate.
 * @param {number} props.page - Current page index (0-based).
 * @param {number} props.rowsPerPage - Number of rows to display per page.
 * @param {function} props.handleChangePage - Callback for handling page changes.
 * @param {function} props.handleChangeRowsPerPage - Callback for handling changes to rows per page.
 * @returns {JSX.Element} The Pagination component.
 */
function Pagination({
	paginationLabel,
	itemCount = 0,
	page = 0,
	rowsPerPage = 5,
	handleChangePage,
	handleChangeRowsPerPage,
}) {
	const theme = useTheme();

	const start = page * rowsPerPage + 1;
	const end = Math.min(page * rowsPerPage + rowsPerPage, itemCount);
	const range = `${start} - ${end}`;

	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="space-between"
			px={theme.spacing(4)}
			marginTop={8}
		>
			<Typography
				px={theme.spacing(2)}
				variant="body2"
				sx={{ opacity: 0.7 }}
			>
				Showing {range} of {itemCount} {paginationLabel}
			</Typography>
			<TablePagination
				component="div"
				count={itemCount}
				page={page}
				onPageChange={handleChangePage}
				rowsPerPage={rowsPerPage}
				rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
				onRowsPerPageChange={handleChangeRowsPerPage}
				ActionsComponent={TablePaginationActions}
				labelRowsPerPage="Rows per page"
				labelDisplayedRows={({ page, count }) =>
					`Page ${page + 1} of ${Math.max(0, Math.ceil(count / rowsPerPage))}`
				}
				slotProps={{
					select: {
						MenuProps: {
							keepMounted: true,
							disableScrollLock: true,
							PaperProps: {
								className: "pagination-dropdown",
								sx: {
									mt: 0,
									mb: theme.spacing(2),
								},
							},
							transformOrigin: { vertical: "bottom", horizontal: "left" },
							anchorOrigin: { vertical: "top", horizontal: "left" },
							sx: {
								mt: theme.spacing(-2),
							},
						},
						inputProps: { id: "pagination-dropdown" },
						IconComponent: SelectorVertical,
						sx: {
							ml: theme.spacing(4),
							mr: theme.spacing(12),
							minWidth: theme.spacing(20),
							textAlign: "left",
							"&.Mui-focused > div": {
								backgroundColor: theme.palette.primary.main,
							},
							"& .MuiSelect-icon": {
								// Add this style override
								position: "absolute",
								right: 0,
								top: "50%",
								transform: "translateY(-50%)",
							},
						},
					},
				}}
				sx={{
					color: theme.palette.primary.contrastTextSecondary,
					"& svg path": {
						stroke: theme.palette.primary.contrastTextTertiary,
						strokeWidth: 1.3,
					},
					"& .MuiSelect-select": {
						border: 1,
						borderColor: theme.palette.primary.lowContrast,
						borderRadius: theme.shape.borderRadius,
					},
				}}
			/>
		</Stack>
	);
}

export default Pagination;
