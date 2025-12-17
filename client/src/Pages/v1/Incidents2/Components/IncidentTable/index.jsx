//Components
import DataTable from "@/Components/v1/Table/index.jsx";
import TableSkeleton from "@/Components/v1/Table/skeleton.jsx";
import Pagination from "@/Components/v1/Table/TablePagination/index.jsx";
import { StatusLabel } from "@/Components/v1/Label/index.jsx";
import { HttpStatusLabel } from "@/Components/v1/HttpStatusLabel/index.jsx";
import GenericFallback from "@/Components/v1/GenericFallback/index.jsx";
import NetworkError from "@/Components/v1/GenericFallback/NetworkError.jsx";

//Utils
import { formatDateWithTz } from "../../../../../Utils/timeUtils.js";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { Button, Typography, useTheme } from "@mui/material";

const IncidentTable = ({
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
}) => {
	const uiTimezone = useSelector((state) => state.ui.timezone);

	const { t } = useTranslation();
	const theme = useTheme();

	const handleResolveIncident = async (incidentId) => {
		await resolveIncident(incidentId);
		handleUpdateTrigger();
	};

	const headers = [
		{
			id: "monitorName",
			content: t("incidentsTableMonitorName"),
			render: (row) => row.monitorName ?? "N/A",
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
				if (row.status === true) {
					return (
						<Button
							variant="contained"
							color="accent"
							sx={{
								minHeight: "max-content",
								lineHeight: 1.2,
							}}
							onClick={() => {
								handleResolveIncident(row._id);
							}}
						>
							{t("incidentsPage.incidentsTableActionResolveManually")}
						</Button>
					);
				} else {
					return (
						<Typography
							variant="body2"
							color={theme.palette.primary.contrastTextSecondary}
						>
							{t("incidentsPage.incidentsTableResolved")}
						</Typography>
					);
				}
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

	if (!isLoading && incidents == undefined) {
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
};

export default IncidentTable;
