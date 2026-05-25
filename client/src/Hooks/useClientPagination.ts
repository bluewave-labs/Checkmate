import { useState } from "react";

export const useClientPagination = <T>(rows: T[], initialRowsPerPage = 10) => {
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

	const handlePageChange = (
		_e: React.MouseEvent<HTMLButtonElement> | null,
		newPage: number
	) => {
		setPage(newPage);
	};

	const handleRowsPerPageChange = (
		e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
	) => {
		setPage(0);
		setRowsPerPage(Number(e.target.value));
	};

	const pagedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	return {
		page,
		rowsPerPage,
		pagedRows,
		paginationProps: {
			component: "div" as const,
			count: rows.length,
			page,
			rowsPerPage,
			onPageChange: handlePageChange,
			onRowsPerPageChange: handleRowsPerPageChange,
			itemsOnPage: pagedRows.length,
		},
	};
};
