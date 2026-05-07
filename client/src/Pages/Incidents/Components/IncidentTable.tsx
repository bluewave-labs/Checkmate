import { Table, ValueLabel, Tooltip } from "@/Components/design-elements";
import { Pagination } from "@/Components/design-elements/Table";
import type { Header } from "@/Components/design-elements/Table";
import { ActionsMenu } from "@/Components/actions-menu";
import type { Incident } from "@/Types/Incident";
import type { Monitor } from "@/Types/Monitor";
import type { ActionMenuItem } from "@/Components/actions-menu";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import { useSelector } from "react-redux";
import type { RootState } from "@/Types/state";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { getMonitorPath } from "@/Utils/MonitorUtils";
import {
	formatStatusCode,
	getStatusCodeTooltip,
	getStatusCodeValueType,
} from "@/Utils/statusCode";

interface IncidentsTableProps {
	title?: string;
	incidents?: Incident[];
	monitors?: Monitor[];
	incidentsCount: number;
	page: number;
	setPage: (page: number) => void;
	rowsPerPage: number;
	setRowsPerPage: (rowsPerPage: number) => void;
	onOpenDetails?: (incidentId: string) => void;
	onResolve?: (incidentId: string) => void;
}

export const IncidentsTable = ({
	incidents,
	monitors,
	incidentsCount,
	page,
	setPage,
	rowsPerPage,
	setRowsPerPage,
	onOpenDetails,
	onResolve,
}: IncidentsTableProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const navigate = useNavigate();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);

	const getActions = (incident: Incident): ActionMenuItem[] => {
		const monitor = monitors?.find((m) => m.id === incident.monitorId);
		const isActive = incident.status === true;

		const actions: ActionMenuItem[] = [
			{
				id: "details",
				label: t("pages.incidents.table.actions.details"),
				action: () => onOpenDetails?.(incident.id),
				closeMenu: true,
			},
			{
				id: "goToMonitor",
				label: t("pages.incidents.table.actions.goToMonitor"),
				action: () => {
					if (monitor) {
						const path = getMonitorPath(monitor.type);
						if (path && monitor.id) {
							navigate(`/${path}/${monitor.id}`);
						}
					}
				},
				closeMenu: true,
			},
		];

		if (isActive) {
			actions.push({
				id: "resolve",
				label: t("pages.incidents.table.actions.resolveManually"),
				action: () => onResolve?.(incident.id),
				closeMenu: true,
			});
		}

		return actions;
	};

	const getHeaders = (): Header<Incident>[] => {
		return [
			{
				id: "monitorName",
				content: t("common.table.headers.monitor"),
				render: (row) => {
					const monitor = monitors?.find((m) => m.id === row.monitorId);
					return monitor?.name || "N/A";
				},
			},
			{
				id: "status",
				content: t("common.table.headers.status"),
				render: (row) => {
					const isActive = row.status === true;
					return (
						<ValueLabel
							value={isActive ? "negative" : "positive"}
							text={
								isActive
									? t("pages.incidents.table.status.active")
									: t("pages.incidents.table.status.resolved")
							}
						/>
					);
				},
			},
			{
				id: "startTime",
				content: t("pages.incidents.table.headers.startTime"),
				render: (row) => {
					return formatDateWithTz(row.createdAt, "YYYY-MM-DD HH:mm:ss A", uiTimezone);
				},
			},
			{
				id: "endTime",
				content: t("pages.incidents.table.headers.endTime"),
				render: (row) => {
					if (row.endTime) {
						return formatDateWithTz(row.endTime, "YYYY-MM-DD HH:mm:ss A", uiTimezone);
					}
					return "-";
				},
			},
			{
				id: "resolutionType",
				content: t("pages.incidents.table.headers.resolutionType"),
				render: (row) => {
					if (row.resolutionType) {
						return (
							<Typography
								variant="body2"
								sx={{
									textTransform: "capitalize",
									color:
										row.resolutionType === "manual"
											? theme.palette.warning.main
											: theme.palette.success.main,
								}}
							>
								{row.resolutionType}
							</Typography>
						);
					}
					return "-";
				},
			},
			{
				id: "statusCode",
				content: t("pages.incidents.table.headers.statusCode"),
				render: (row) => {
					const code = row.statusCode;
					if (!code) return "N/A";
					const text = formatStatusCode(code, t);
					const tooltip = getStatusCodeTooltip(code, row.message, t);
					const label = (
						<ValueLabel
							value={getStatusCodeValueType(code)}
							text={text}
						/>
					);
					return tooltip ? (
						<Tooltip title={tooltip}>
							<span>{label}</span>
						</Tooltip>
					) : (
						label
					);
				},
			},
			{
				id: "message",
				content: t("common.table.headers.message"),
				render: (row) => row.message || "-",
			},
			{
				id: "actions",
				content: t("common.table.headers.actions"),
				render: (row) => <ActionsMenu items={getActions(row)} />,
			},
		];
	};

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

	if (!incidents || !monitors) {
		return null;
	}

	return (
		<Box>
			<Table
				headers={getHeaders()}
				data={incidents}
				onRowClick={(row) => onOpenDetails?.(row.id)}
				emptyViewText={t("common.table.empty")}
			/>
			<Pagination
				component="div"
				count={incidentsCount}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={handlePageChange}
				onRowsPerPageChange={handleRowsPerPageChange}
				itemsOnPage={incidents.length}
			/>
		</Box>
	);
};
