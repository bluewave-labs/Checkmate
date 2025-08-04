//Components
import Table from "../../../../Components/Table";
import TableSkeleton from "../../../../Components/Table/skeleton";
import Pagination from "../../../../Components/Table/TablePagination";
import { StatusLabel } from "../../../../Components/Label";
import { HttpStatusLabel } from "../../../../Components/HttpStatusLabel";
import GenericFallback from "../../../../Components/GenericFallback";
import NetworkError from "../../../../Components/GenericFallback/NetworkError";

//Utils
import { formatDateWithTz } from "../../../../Utils/timeUtils";
import { useSelector } from "react-redux";
import { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { useFetchData } from "../../../../Hooks/useFetchData";
import { useResolveIncident } from "../../../../Hooks/checkHooks";
import { Button, Typography } from "@mui/material";

const IncidentTable = ({
	isLoading,
	monitors,
	selectedMonitor,
	filter,
	dateRange,
	updateTrigger,
	setUpdateTrigger,
}) => {
	//Redux state
	const uiTimezone = useSelector((state) => state.ui.timezone);

	//Local state
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const selectedMonitorDetails = monitors?.[selectedMonitor];
	const selectedMonitorType = selectedMonitorDetails?.type;

	//Hooks
	const [resolveIncident, resolveLoading] = useResolveIncident();

	const [checksMonitor, checksCountMonitor, isLoadingMonitor, networkErrorMonitor] =
		useFetchData({
			requestFn: () =>
				networkService.getChecksByMonitor({
					monitorId: selectedMonitor === "0" ? undefined : selectedMonitor,
					type: selectedMonitorType,
					status: false,
					sortOrder: "desc",
					limit: null,
					dateRange,
					filter: filter === "resolved" ? "all" : filter,
					ack: filter === "resolved" ? true : false,
					page,
					rowsPerPage,
				}),
			enabled: selectedMonitor !== "0",
			deps: [
				selectedMonitor,
				selectedMonitorType,
				dateRange,
				filter,
				page,
				rowsPerPage,
				updateTrigger,
			],
			shouldRun: Boolean(selectedMonitorType), // only run if type is truthy
		});

	const [checksTeam, checksCountTeam, isLoadingTeam, networkErrorTeam] = useFetchData({
		requestFn: () =>
			networkService.getChecksByTeam({
				status: false,
				sortOrder: "desc",
				limit: null,
				dateRange,
				filter: filter === "resolved" ? "all" : filter,
				ack: filter === "resolved" ? true : false,
				page,
				rowsPerPage,
			}),
		enabled: selectedMonitor === "0",
		deps: [dateRange, filter, page, rowsPerPage, selectedMonitor, updateTrigger],
		shouldRun: true, // optional
	});

	const checks = selectedMonitor === "0" ? checksTeam : checksMonitor;
	const checksCount = selectedMonitor === "0" ? checksCountTeam : checksCountMonitor;
	isLoading = isLoadingTeam || isLoadingMonitor;
	const networkError = selectedMonitor === "0" ? networkErrorTeam : networkErrorMonitor;

	const { t } = useTranslation();

	//Handlers
	const handleChangePage = (_, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(event.target.value);
	};

	const handleResolveIncident = (checkId) => {
		resolveIncident(checkId, setUpdateTrigger);
	};

	const headers = [
		{
			id: "monitorName",
			content: t("incidentsTableMonitorName"),
			render: (row) => monitors[row.monitorId]?.name ?? "N/A",
		},
		{
			id: "status",
			content: t("incidentsTableStatus"),
			render: (row) => {
				const status = row.status === true ? "up" : "down";
				return (
					<StatusLabel
						status={status}
						text={status}
						customStyles={{ textTransform: "capitalize" }}
					/>
				);
			},
		},
		{
			id: "dateTime",
			content: t("incidentsTableDateTime"),
			render: (row) => {
				const formattedDate = formatDateWithTz(
					row.createdAt,
					"YYYY-MM-DD HH:mm:ss A",
					uiTimezone
				);
				return formattedDate;
			},
		},
		{
			id: "statusCode",
			content: t("incidentsTableStatusCode"),
			render: (row) => <HttpStatusLabel status={row.statusCode} />,
		},
		{ id: "message", content: t("incidentsTableMessage"), render: (row) => row.message },
		{
			id: "action",
			content: t("actions"),
			render: (row) => {
				return row.ack === false ? (
					<Button
						variant="contained"
						color="accent"
						onClick={() => {
							handleResolveIncident(row._id);
						}}
					>
						{t("incidentsTableActionResolve")}
					</Button>
				) : (
					<Typography>
						{t("incidentsTableResolvedAt")}{" "}
						{formatDateWithTz(row.ackAt, "YYYY-MM-DD HH:mm:ss A", uiTimezone)}
					</Typography>
				);
			},
		},
	];

	if (isLoading || resolveLoading) return <TableSkeleton />;

	if (networkError) {
		return (
			<GenericFallback>
				<NetworkError />
			</GenericFallback>
		);
	}

	if (!isLoading && typeof checksCount === "undefined") {
		return <GenericFallback>{t("incidentsTableNoIncidents")}</GenericFallback>;
	}

	return (
		<>
			<Table
				headers={headers}
				data={checks}
			/>
			<Pagination
				paginationLabel={t("incidentsTablePaginationLabel")}
				itemCount={checksCount}
				page={page}
				rowsPerPage={rowsPerPage}
				handleChangePage={handleChangePage}
				handleChangeRowsPerPage={handleChangeRowsPerPage}
			/>
		</>
	);
};

IncidentTable.propTypes = {
	isLoading: PropTypes.bool,
	monitors: PropTypes.object,
	selectedMonitor: PropTypes.string,
	filter: PropTypes.string,
	dateRange: PropTypes.string,
	updateTrigger: PropTypes.bool,
	setUpdateTrigger: PropTypes.func,
};
export default IncidentTable;
