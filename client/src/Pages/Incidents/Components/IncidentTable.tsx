import { Table } from "@/Components/v2/design-elements";
import { Pagination } from "@/Components/v2/design-elements/Table";
import type { Header } from "@/Components/v2/design-elements/Table";
import { StatusLabel, ValueLabel } from "@/Components/v2/design-elements";
import type { ValueType } from "@/Components/v2/design-elements/StatusLabel";
import { ActionsMenu } from "@/Components/v2/actions-menu";
import type { Incident } from "@/Types/Incident";
import type { Monitor } from "@/Types/Monitor";
import type { ActionMenuItem } from "@/Components/v2/actions-menu";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { TypeToPathMap } from "@/Utils/monitorUtilsLegacy.js";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import { useSelector } from "react-redux";
import type { RootState } from "@/Types/state";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";

interface IncidentsTableProps {
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
				label: t("incidentsPage.incidentsTableActionDetails"),
				action: () => onOpenDetails?.(incident.id),
				closeMenu: true,
			},
			{
				id: "goToMonitor",
				label: t("incidentsPage.incidentsTableActionGoToMonitor"),
				action: () => {
					if (monitor) {
						const path = TypeToPathMap[monitor.type as keyof typeof TypeToPathMap];
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
				label: t("incidentsPage.incidentsTableActionResolveManually"),
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
					const status = row.status === true ? false : true;
					return <StatusLabel status={status} />;
				},
			},
			{
				id: "startTime",
				content: t("incidentsPage.startTime"),
				render: (row) => {
					return formatDateWithTz(
						row.createdAt,
						"YYYY-MM-DD HH:mm:ss A",
						uiTimezone
					);
				},
			},
			{
				id: "endTime",
				content: t("incidentsPage.endTime"),
				render: (row) => {
					if (row.endTime) {
						return formatDateWithTz(
							row.endTime,
							"YYYY-MM-DD HH:mm:ss A",
							uiTimezone
						);
					}
					return "-";
				},
			},
			{
				id: "resolutionType",
				content: t("incidentsPage.resolutionType"),
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
				content: t("incidentsPage.statusCode"),
				render: (row) => {
					const code = row.statusCode;
					if (!code) return "N/A";
					let value: ValueType = "neutral";
					if (code < 300) value = "positive";
					else if (code >= 400) value = "negative";
					return <ValueLabel value={value} text={String(code)} />;
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
			/>
		</Box>
	);
};
