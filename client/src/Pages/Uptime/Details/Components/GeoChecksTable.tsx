import {
	Table,
	Pagination,
	StatusLabel,
	StatusCodeLabel,
} from "@/Components/design-elements";
import Box from "@mui/material/Box";
import type { Header } from "@/Components/design-elements";
import { MonitorStatus } from "@/Types/Monitor";
import type { FlatGeoCheck } from "@/Types/GeoCheck";
import { useTranslation } from "react-i18next";
import { formatDateWithTz, formatMs } from "@/Utils/TimeUtils";
import type { RootState } from "@/Types/state";
import { useSelector } from "react-redux";

export const GeoChecksTable = ({
	geoChecks,
	count,
	page,
	setPage,
	rowsPerPage,
	setRowsPerPage,
}: {
	geoChecks: FlatGeoCheck[];
	count: number;
	page: number;
	setPage: (page: number) => void;
	rowsPerPage: number;
	setRowsPerPage: (rowsPerPage: number) => void;
}) => {
	const { t } = useTranslation();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);

	const headers: Header<FlatGeoCheck>[] = [
		{
			id: "status",
			content: t("common.table.headers.status"),
			render: (row) => {
				const status = row.status ? MonitorStatus.Up : MonitorStatus.Down;
				return <StatusLabel status={status} />;
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
			id: "statusCode",
			content: t("pages.checks.table.headers.statusCode"),
			render: (row) => {
				return <StatusCodeLabel statusCode={row.statusCode} />;
			},
		},
		{
			id: "location",
			content: t("pages.checks.table.headers.location"),
			render: (row) => {
				const location = row.location;
				if (!location) return "N/A";
				const { continent, country, city } = location;
				return `${continent} - ${country}, ${city}`;
			},
		},
		{
			id: "responseTime",
			content: t("common.table.headers.responseTime"),
			render: (row) => {
				if (!row.timings?.total) return "N/A";
				return formatMs(row.timings.total);
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
				data={geoChecks}
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
