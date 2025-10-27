import { Table, Pagination } from "@/Components/v2/DesignElements";
import { StatusLabel } from "@/Components/v2/DesignElements";
import Box from "@mui/material/Box";

import type { Header } from "@/Components/v2/DesignElements/Table";
import type { Check } from "@/Types/Check";
import type { ApiResponse } from "@/Hooks/v2/UseApi";
import type { MonitorStatus } from "@/Types/Monitor";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGet } from "@/Hooks/v2/UseApi";
import { formatDateWithTz } from "@/Utils/v2/TimeUtils";
import { useSelector } from "react-redux";
const getHeaders = (t: Function, uiTimezone: string) => {
	const headers: Header<Check>[] = [
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
				return formatDateWithTz(row.createdAt, "ddd, MMMM D, YYYY, HH:mm A", uiTimezone);
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
	const uiTimezone = useSelector((state: any) => state.ui.timezone);
	const headers = getHeaders(t, uiTimezone);

	const { response, error } = useGet<ApiResponse>(
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
			<Table
				headers={headers}
				data={checks}
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
