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
import useChecksFetch from "../../Hooks/useChecksFetch";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const IncidentTable = ({
	shouldRender,
	monitors,
	selectedMonitor,
	filter,
	dateRange,
}) => {
	//Redux state
	const uiTimezone = useSelector((state) => state.ui.timezone);

	//Local state
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const selectedMonitorDetails = monitors?.[selectedMonitor];
	const selectedMonitorType = selectedMonitorDetails?.type;
	const { isLoading, networkError, checks, checksCount } = useChecksFetch({
		selectedMonitor,
		selectedMonitorType,
		filter,
		dateRange,
		page,
		rowsPerPage,
	});

	const { t } = useTranslation();

	//Handlers
	const handleChangePage = (_, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(event.target.value);
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
	];

	if (!shouldRender || isLoading) return <TableSkeleton />;

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
	shouldRender: PropTypes.bool,
	monitors: PropTypes.object,
	selectedMonitor: PropTypes.string,
	filter: PropTypes.string,
	dateRange: PropTypes.string,
};
export default IncidentTable;
