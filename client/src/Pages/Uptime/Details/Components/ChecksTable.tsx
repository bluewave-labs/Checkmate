import {
	Table,
	Pagination,
	StatusLabel,
	StatusCodeLabel,
	CopyButton,
} from "@/Components/design-elements";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { LAYOUT } from "@/Utils/Theme/constants";
import type { Header } from "@/Components/design-elements";
import type { Check } from "@/Types/Check";

import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import type { RootState } from "@/Types/state";
import { useSelector } from "react-redux";

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
	const theme = useTheme();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);

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
				return formatDateWithTz(row.createdAt, "ddd, MMMM D, YYYY, HH:mm A", uiTimezone);
			},
		},
		{
			id: "message",
			content: t("common.table.headers.message"),
			render: (row) => {
				if (!row.message) return "N/A";
				return (
					<Stack
						direction="row"
						alignItems="center"
						justifyContent="center"
						gap={theme.spacing(LAYOUT.XS)}
					>
						<span>{row.message}</span>
						<CopyButton
							value={row.message}
							label={t("common.copyMessage")}
						/>
					</Stack>
				);
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
