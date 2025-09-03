//Components
import Stack from "@mui/material/Stack";
import DataTable from "../../../../Components/Table";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
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
import { useFetchChecksTeam } from "../../../../Hooks/checkHooks";
import { useFetchChecksByMonitor } from "../../../../Hooks/checkHooks";
import { useResolveIncident } from "../../../../Hooks/checkHooks";
import { Button, Typography, useTheme } from "@mui/material";
import { lighten } from "@mui/material/styles";

const GetTooltip = (row) => {
	const theme = useTheme();
	const phases = row?.timings?.phases;

	const phaseKeyFormattingMap = {
		firstByte: "first byte",
	};
	return (
		<Stack
			backgroundColor={lighten(theme.palette.primary.main, 0.1)}
			border={`1px solid ${theme.palette.primary.lowContrast}`}
			borderRadius={theme.shape.borderRadius}
			py={theme.spacing(2)}
			px={theme.spacing(4)}
		>
			<Typography
				variant="body2"
				color={theme.palette.primary.contrastText}
			>{`Status code: ${row?.statusCode}`}</Typography>
			<Typography
				variant="body2"
				color={theme.palette.primary.contrastText}
			>{`Response time: ${row?.responseTime} ms`}</Typography>
			{phases && (
				<>
					<Typography
						variant="body2"
						color={theme.palette.primary.contrastText}
					>{`Request timing: `}</Typography>
					<Table
						size="small"
						sx={{ ml: theme.spacing(2), mt: theme.spacing(2) }}
					>
						<TableBody>
							{Object.keys(phases)?.map((phaseKey) => (
								<TableRow key={phaseKey}>
									<TableCell sx={{ border: "none", p: 0 }}>
										<Typography
											variant="body2"
											color="success"
										>
											{`${phaseKeyFormattingMap[phaseKey] || phaseKey}:`}
										</Typography>
									</TableCell>
									<TableCell sx={{ border: "none", p: 0 }}>
										<Typography
											color={theme.palette.primary.contrastText}
											variant="body2"
										>{`${phases[phaseKey]} ms`}</Typography>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</>
			)}
		</Stack>
	);
};

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
		useFetchChecksByMonitor({
			monitorId: selectedMonitor === "0" ? undefined : selectedMonitor,
			type: selectedMonitorType,
			status: false,
			sortOrder: "desc",
			limit: null,
			dateRange,
			filter: filter === "resolved" ? "all" : filter,
			ack: filter === "resolved" ? true : false,
			page: page,
			rowsPerPage: rowsPerPage,
			enabled: selectedMonitor !== "0",
			updateTrigger,
		});

	const [checksTeam, checksCountTeam, isLoadingTeam, networkErrorTeam] =
		useFetchChecksTeam({
			status: false,
			sortOrder: "desc",
			limit: null,
			dateRange,
			filter: filter === "resolved" ? "all" : filter,
			ack: filter === "resolved" ? true : false,
			page: page,
			rowsPerPage: rowsPerPage,
			enabled: selectedMonitor === "0",
			updateTrigger,
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
			<DataTable
				headers={headers}
				data={checks}
				config={{ tooltipContent: GetTooltip }}
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
