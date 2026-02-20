import { Table, Pagination, StatusLabel } from "@/Components/v2/design-elements";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Header } from "@/Components/v2/design-elements/";
import type { Check } from "@/Types/Check";

import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import type { RootState } from "@/Types/state";
import { useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";

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
	globalpingEnabled = false,
	locationLabels = {},
}: {
	checks: Check[];
	count: number;
	page: number;
	setPage: (page: number) => void;
	rowsPerPage: number;
	setRowsPerPage: (rowsPerPage: number) => void;
	globalpingEnabled?: boolean;
	locationLabels?: Record<string, string>;
}) => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const theme = useTheme();
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

	const renderExpandedContent = (row: Check) => {
		if (!row.locationResults || row.locationResults.length === 0) {
			return null;
		}

		return (
			<Stack gap={theme.spacing(2)}>
				<Stack
					direction="row"
					sx={{
						px: theme.spacing(4),
						py: theme.spacing(2),
						borderBottom: `1px solid ${theme.palette.divider}`,
					}}
				>
					<Typography
						variant="body2"
						fontWeight={600}
						sx={{ flex: 2 }}
					>
						{t("pages.checks.expandedRow.location")}
					</Typography>
					<Typography
						variant="body2"
						fontWeight={600}
						sx={{ flex: 1 }}
					>
						{t("common.table.headers.status")}
					</Typography>
					<Typography
						variant="body2"
						fontWeight={600}
						sx={{ flex: 1 }}
					>
						{t("pages.checks.expandedRow.responseTime")}
					</Typography>
					<Typography
						variant="body2"
						fontWeight={600}
						sx={{ flex: 1 }}
					>
						{t("pages.checks.expandedRow.statusCode")}
					</Typography>
				</Stack>
				{row.locationResults.map((lr) => (
					<Stack
						key={lr.location}
						direction="row"
						sx={{
							px: theme.spacing(4),
							py: theme.spacing(1),
							alignItems: "center",
						}}
					>
						<Typography
							variant="body2"
							sx={{ flex: 2 }}
						>
							{locationLabels[lr.location] ?? lr.location}
						</Typography>
						<Box sx={{ flex: 1 }}>
							<StatusLabel status={lr.status ? "up" : "down"} />
						</Box>
						<Typography
							variant="body2"
							sx={{ flex: 1 }}
						>
							{Math.round(lr.responseTime)} ms
						</Typography>
						<Typography
							variant="body2"
							sx={{ flex: 1 }}
						>
							{lr.statusCode || "N/A"}
						</Typography>
					</Stack>
				))}
			</Stack>
		);
	};

	return (
		<Box>
			<Table
				headers={headers}
				data={checks}
				onRowClick={(row) => {
					navigate(`/checks/${row.id}`);
				}}
				expandableRows={globalpingEnabled}
				renderExpandedContent={globalpingEnabled ? renderExpandedContent : undefined}
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
