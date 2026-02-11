import { Table, Pagination, StatusLabel } from "@/Components/v2/design-elements";
import Box from "@mui/material/Box";
import type { Header } from "@/Components/v2/design-elements/";
import type { Check } from "@/Types/Check";

import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import type { RootState } from "@/Types/state";
import { useSelector } from "react-redux";

const getHeaders = (t: Function, uiTimezone: string) => {
	const headers: Header<Check>[] = [
		{
			id: "status",
			content: t("common.table.headers.status"),
			render: (row) => {
				return <StatusLabel status={row.status === true ? "up" : "down"} />;
			},
		},
		{
			id: "date",
			content: t("pages.checks.table.headers.dateTime"),
			render: (row) => {
				return formatDateWithTz(row.createdAt, "ddd, MMMM D, YYYY, HH:mm A", uiTimezone);
			},
		},
		{
			id: "message",
			content: t("common.table.headers.message"),
			render: (row) => {
				return row.message || "N/A";
			},
		},
		{
			id: "statusCode",
			content: t("pages.checks.table.headers.statusCode"),
			render: (row) => {
				return row.statusCode || "N/A";
			},
		},
	];
	return headers;
};

export const ChecksTable = ({
	checks,
	count,
	page,
	setPage,
	rowsPerPage,
	setRowsPerPage,
}: {
	checks: Check[];
	count: number;
	page: number;
	setPage: (page: number) => void;
	rowsPerPage: number;
	setRowsPerPage: (rowsPerPage: number) => void;
}) => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);
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
					navigate(`/checks/${row.id}`);
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
