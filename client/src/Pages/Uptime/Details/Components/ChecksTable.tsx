import {
	Table,
	Pagination,
	StatusLabel,
	StatusCodeLabel,
} from "@/Components/design-elements";
import Box from "@mui/material/Box";
import type { Header } from "@/Components/design-elements";
import type { Check } from "@/Types/Check";

import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useFormatDate } from "@/Hooks/useFormatDate";

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
	const formatDate = useFormatDate();
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
			content: t("common.table.headers.dateTime"),
			render: (row) => {
				return formatDate(row.createdAt, "dateTime");
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
				return (
					<StatusCodeLabel
						statusCode={row.statusCode}
						message={row.message}
					/>
				);
			},
		},
	];

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
