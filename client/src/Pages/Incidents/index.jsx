// Components
import { Stack } from "@mui/material";
import Breadcrumbs from "@/Components/v1/Breadcrumbs/index.jsx";
import GenericFallback from "@/Components/v1/GenericFallback/index.jsx";
import IncidentTable from "./Components/IncidentTable/index.jsx";
import OptionsHeader from "./Components/OptionsHeader/index.jsx";
import IncidentsSummaryPanel from "./Components/IncidentsSummaryPanel/index.jsx";
import IncidentDetailsModal from "./Components/IncidentDetailsModal/index.jsx";
//Utils
import { useTheme } from "@emotion/react";
import { useState, useEffect } from "react";
import NetworkError from "@/Components/v1/GenericFallback/NetworkError.jsx";
import { useTranslation } from "react-i18next";

// Hooks
import useFetchIncidents from "./hooks/useFetchIncidents.js";
import { useFetchMonitorsByTeamId } from "../../Hooks/monitorHooks.js";

const Incidents2 = () => {
	const { t } = useTranslation();

	const BREADCRUMBS = [
		{ name: t("incidentsPageTitle", "Incidents"), path: "/incidents" },
	];

	const [selectedMonitor, setSelectedMonitor] = useState("0");
	const [filter, setFilter] = useState("all");
	const [dateRange, setDateRange] = useState("all");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [monitorLookup, setMonitorLookup] = useState(undefined);
	const [updateTrigger, setUpdateTrigger] = useState(false);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [selectedIncidentId, setSelectedIncidentId] = useState(null);
	const handleUpdateTrigger = () => {
		setUpdateTrigger((prev) => !prev);
	};

	const [monitors, isLoadingMonitors, monitorsNetworkError] = useFetchMonitorsByTeamId(
		{}
	);

	const {
		incidents,
		incidentsCount,
		isLoading: isLoadingIncidents,
		networkError: incidentsNetworkError,
		fetchIncidents,
		fetchActiveIncidents,
		fetchResolvedIncidents,
		resolveIncident,
	} = useFetchIncidents();

	const networkError = monitorsNetworkError || incidentsNetworkError;

	const theme = useTheme();

	useEffect(() => {
		setPage(0);
	}, [selectedMonitor, filter, dateRange]);

	useEffect(() => {
		const config = {
			monitorId: selectedMonitor !== "0" ? selectedMonitor : undefined,
			sortOrder: "desc",
			dateRange,
			page,
			rowsPerPage,
		};

		if (filter === "active") {
			fetchActiveIncidents(config);
		} else if (filter === "resolved") {
			fetchResolvedIncidents(config);
		} else {
			fetchIncidents(config);
		}
	}, [
		selectedMonitor,
		filter,
		dateRange,
		page,
		rowsPerPage,
		updateTrigger,
		fetchActiveIncidents,
		fetchResolvedIncidents,
		fetchIncidents,
	]);

	useEffect(() => {
		const lookup = monitors?.reduce((acc, monitor) => {
			acc[monitor.id] = {
				id: monitor.id,
				name: monitor.name,
				type: monitor.type,
			};
			return acc;
		}, {});
		setMonitorLookup(lookup);
	}, [monitors]);

	if (networkError) {
		return (
			<GenericFallback>
				<NetworkError />
			</GenericFallback>
		);
	}

	const handleChangePage = (_, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};
	const handleOpenDetails = (id) => {
		if (!id) return;
		setSelectedIncidentId(id);
		setIsDetailsOpen(true);
	};

	const handleCloseDetails = () => {
		setIsDetailsOpen(false);
		setSelectedIncidentId(null);
	};

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />

			<IncidentsSummaryPanel updateTrigger={updateTrigger} />

			<OptionsHeader
				shouldRender={!isLoadingMonitors}
				monitors={monitorLookup}
				selectedMonitor={selectedMonitor}
				setSelectedMonitor={setSelectedMonitor}
				filter={filter}
				setFilter={setFilter}
				dateRange={dateRange}
				setDateRange={setDateRange}
			/>

			<IncidentTable
				monitors={monitors || []}
				incidents={incidents || []}
				incidentsCount={incidentsCount || 0}
				isLoading={isLoadingIncidents}
				networkError={incidentsNetworkError}
				page={page}
				rowsPerPage={rowsPerPage}
				handleChangePage={handleChangePage}
				handleChangeRowsPerPage={handleChangeRowsPerPage}
				resolveIncident={resolveIncident}
				handleUpdateTrigger={handleUpdateTrigger}
				onOpenDetails={handleOpenDetails}
			/>
			<IncidentDetailsModal
				open={isDetailsOpen}
				incidentId={selectedIncidentId}
				onClose={handleCloseDetails}
				onResolved={handleUpdateTrigger}
			/>
		</Stack>
	);
};

export default Incidents2;
