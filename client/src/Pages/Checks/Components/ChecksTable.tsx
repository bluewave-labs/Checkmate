import { Table, Pagination, ValueLabel, StatusLabel } from "@/Components/design-elements";
import Box from "@mui/material/Box";
import type { Header } from "@/Components/design-elements/Table";
import type { Monitor } from "@/Types/Monitor";

import { useTranslation } from "react-i18next";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import { useNavigate } from "react-router";
import type { Check } from "@/Types/Check";
import type { RootState } from "@/Types/state";
import { useSelector } from "react-redux";

export const ChecksTable = ({
	monitors,
	checks,
	checksCount,
	page,
	setPage,
	rowsPerPage,
	setRowsPerPage,
}: {
	monitors: Monitor[] | null;
	checks: Check[];
	checksCount: number;
	page: number;
	setPage: (page: number) => void;
	rowsPerPage: number;
	setRowsPerPage: (rowsPerPage: number) => void;
}) => {
	const { t } = useTranslation();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);
	const navigate = useNavigate();

	const getHeaders = (t: Function, uiTimezone: string) => {
		const headers: Header<Check>[] = [
			{
				id: "monitorName",
				content: t("common.table.headers.monitor"),
				render: (row) => {
					return (
						monitors?.find((monitor) => monitor.id === row.metadata.monitorId)?.name ||
						"N/A"
					);
				},
			},
			{
				id: "status",
				content: "Status",
				render: (row) => {
					return <StatusLabel status={row.status === true ? "up" : "down"} />;
				},
			},
			{
				id: "date",
				content: t("common.table.headers.dateTime"),
				render: (row) => {
					return formatDateWithTz(
						row.createdAt,
						"ddd, MMMM D, YYYY, HH:mm A",
						uiTimezone
					);
				},
			},
			{
				id: "statusCode",
				content: t("pages.checks.table.headers.statusCode"),
				render: (row) => {
					const code = row.statusCode;
					if (!code) return "N/A";
					const value = code < 300 ? "positive" : code < 400 ? "neutral" : "negative";
					return (
						<ValueLabel
							value={value}
							text={String(code)}
						/>
					);
				},
			},
			{
				id: "message",
				content: t("common.table.headers.message"),
				render: (row) => {
					return row.message || "N/A";
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
				data={checks}
				onRowClick={(row) => {
					navigate(`/checks/${row.id}`);
				}}
				emptyViewText={t("pages.checks.table.empty")}
			/>
			<Pagination
				component="div"
				count={checksCount}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={handlePageChange}
				onRowsPerPageChange={handleRowsPerPageChange}
			/>
		</Box>
	);
};
