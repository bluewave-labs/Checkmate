import {
	Table,
	Pagination,
	ValueLabel,
	StatusLabel,
} from "@/Components/v2/design-elements";
import Box from "@mui/material/Box";
import type { Header } from "@/Components/v2/design-elements/Table";
import type { Monitor, MonitorStatus } from "@/Types/Monitor";

import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import { useNavigate } from "react-router";
import type { Check, ChecksResponse } from "@/Types/Check";
import type { RootState } from "@/Types/state";
import { useSelector } from "react-redux";
import { useGet } from "@/Hooks/UseApi";

export const ChecksTable = ({
	monitors,
	selectedMonitorId,
	dateRange,
	page,
	setPage,
	rowsPerPage,
	setRowsPerPage,
}: {
	monitors: Monitor[] | null;
	selectedMonitorId: string;
	dateRange: string;
	page: number;
	setPage: (page: number) => void;
	rowsPerPage: number;
	setRowsPerPage: (rowsPerPage: number) => void;
}) => {
	const { t } = useTranslation();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);
	const navigate = useNavigate();

	// Get selected monitor type
	const selectedMonitorType = monitors?.find((m) => m.id === selectedMonitorId)?.type;

	// Team checks URL (when selectedMonitorId === "0")
	const teamChecksUrl = useMemo(() => {
		if (selectedMonitorId !== "0") return null;
		const params = new URLSearchParams();
		params.append("sortOrder", "desc");
		if (dateRange) params.append("dateRange", dateRange);
		params.append("page", String(page));
		params.append("rowsPerPage", String(rowsPerPage));
		return `/checks/team?${params.toString()}`;
	}, [selectedMonitorId, dateRange, page, rowsPerPage]);

	// Monitor checks URL (when specific monitor selected)
	const monitorChecksUrl = useMemo(() => {
		if (selectedMonitorId === "0" || !selectedMonitorType) return null;
		const params = new URLSearchParams();
		params.append("type", selectedMonitorType);
		params.append("sortOrder", "desc");
		params.append("status", "false");
		if (dateRange) params.append("dateRange", dateRange);
		params.append("page", String(page));
		params.append("rowsPerPage", String(rowsPerPage));
		return `/checks/${selectedMonitorId}?${params.toString()}`;
	}, [selectedMonitorId, selectedMonitorType, dateRange, page, rowsPerPage]);

	// Fetch data - null key skips the request
	const { data: teamData, isLoading: isLoadingTeam } =
		useGet<ChecksResponse>(teamChecksUrl);
	const { data: monitorData, isLoading: isLoadingMonitor } =
		useGet<ChecksResponse>(monitorChecksUrl);

	// Select correct data based on selection
	const checks =
		selectedMonitorId === "0" ? (teamData?.checks ?? []) : (monitorData?.checks ?? []);
	const checksCount =
		selectedMonitorId === "0"
			? (teamData?.checksCount ?? 0)
			: (monitorData?.checksCount ?? 0);
	const isLoading = isLoadingTeam || isLoadingMonitor;

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
					return <StatusLabel status={row.status as MonitorStatus} />;
				},
			},
			{
				id: "date",
				content: t("checks.table.headers.dateTime"),
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
				content: t("checks.table.headers.statusCode"),
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
				emptyViewText={t("checks.table.empty")}
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
