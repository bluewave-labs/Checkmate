//Components
import DataTable from "@/Components/v1/Table/index.jsx";
import TableSkeleton from "@/Components/v1/Table/skeleton.jsx";
import Pagination from "@/Components/v1/Table/TablePagination/index.jsx";
import { StatusLabel } from "@/Components/v1/Label/index.jsx";
import { HttpStatusLabel } from "@/Components/v1/HttpStatusLabel/index.jsx";
import GenericFallback from "@/Components/v1/GenericFallback/index.jsx";
import NetworkError from "@/Components/v1/GenericFallback/NetworkError.jsx";
import IncidentActionsMenu from "./IncidentActionsMenu.jsx";

//Utils
import { formatDateWithTz } from "../../../../Utils/timeUtils.js";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { Typography, useTheme } from "@mui/material";

const IncidentTable = ({
	monitors = [],
	incidents = [],
	incidentsCount = 0,
	isLoading = false,
	networkError = false,
	page = 0,
	rowsPerPage = 10,
	handleChangePage,
	handleChangeRowsPerPage,
	resolveIncident,
	handleUpdateTrigger,
	onOpenDetails,
}) => {
	const uiTimezone = useSelector((state) => state.ui.timezone);

	const { t } = useTranslation();
	const theme = useTheme();

	const handleResolveIncident = async (incidentId, options = {}) => {
		try {
			await resolveIncident(incidentId, options);
			handleUpdateTrigger();
		} catch (error) {
			console.error(t("incidentsPage.errorResolvingIncident"), error);
		}
	};

	const headers = [
		{
			id: "monitorName",
			content: t("incidentsTableMonitorName"),
			render: (row) => {
				const monitor = monitors.find((monitor) => monitor.id === row.monitorId);
				return monitor ? monitor.name : "N/A";
			},
		},
		{
			id: "status",
			content: t("incidentsTableStatus"),
			render: (row) => {
				const status = row.status === true ? "down" : "up";
				const statusText =
					row.status === true ? t("incidentsPage.active") : t("incidentsPage.resolved");
				return (
					<StatusLabel
						status={status}
						text={statusText}
					/>
				);
			},
		},
		{
			id: "startTime",
			content: t("incidentsPage.startTime"),
			render: (row) => {
				const formattedDate = formatDateWithTz(
					row.startTime || row.createdAt,
					"YYYY-MM-DD HH:mm:ss A",
					uiTimezone
				);
				return formattedDate;
			},
		},
		{
			id: "endTime",
			content: t("incidentsPage.endTime"),
			render: (row) => {
				if (row.endTime) {
					return formatDateWithTz(row.endTime, "YYYY-MM-DD HH:mm:ss A", uiTimezone);
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
										? theme.palette.accent.main
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
			content: t("incidentsTableStatusCode"),
			render: (row) => <HttpStatusLabel status={row.statusCode} />,
		},
		{
			id: "message",
			content: t("incidentsTableMessage"),
			render: (row) => row.message || "-",
		},
		{
			id: "action",
			content: t("actions"),
			render: (row) => {
				return (
					<IncidentActionsMenu
						incident={row}
						monitor={monitors.find((monitor) => monitor.id === row.monitorId)}
						onResolve={handleResolveIncident}
						onOpenDetails={onOpenDetails}
					/>
				);
			},
		},
	];

	if (isLoading) return <TableSkeleton />;

	if (networkError) {
		return (
			<GenericFallback>
				<NetworkError />
			</GenericFallback>
		);
	}

	if (!isLoading && !networkError && incidents?.length === 0) {
		return (
			<GenericFallback>
				{t("incidentsTableNoIncidents", "No incidents found")}
			</GenericFallback>
		);
	}

	const incidentsData = Array.isArray(incidents) ? incidents : [];

	return (
		<>
			<DataTable
				headers={headers}
				data={incidentsData}
			/>
			<Pagination
				paginationLabel={t("incidentsTablePaginationLabel", "Incidents")}
				itemCount={incidentsCount || 0}
				page={page}
				rowsPerPage={rowsPerPage}
				handleChangePage={handleChangePage}
				handleChangeRowsPerPage={handleChangeRowsPerPage}
			/>
		</>
	);
};

IncidentTable.propTypes = {
	incidents: PropTypes.array.isRequired, // Array of incident objects
	incidentsCount: PropTypes.number.isRequired, // Total count for pagination
	isLoading: PropTypes.bool.isRequired, // Loading state
	networkError: PropTypes.bool, // Network error object
	page: PropTypes.number.isRequired, // Current page number
	rowsPerPage: PropTypes.number.isRequired, // Number of rows per page
	handleChangePage: PropTypes.func.isRequired, // Handler for page change
	handleChangeRowsPerPage: PropTypes.func.isRequired, // Handler for rows per page change
	resolveIncident: PropTypes.func.isRequired,
	handleUpdateTrigger: PropTypes.func.isRequired,
	onOpenDetails: PropTypes.func,
};

export default IncidentTable;
