// Components
import Breadcrumbs from "../../../Components/Breadcrumbs";
import MonitorHeader from "./Components/MonitorHeader";
import StatusBoxes from "./Components/StatusBoxes";
import TimeFramePicker from "./Components/TimeFramePicker";
import ChartBoxes from "./Components/ChartBoxes";
import ResponseTimeChart from "./Components/Charts/ResponseTimeChart";
import ResponseTable from "./Components/ResponseTable";
// MUI Components
import { Stack } from "@mui/material";

// Utils
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTheme } from "@emotion/react";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import useMonitorFetch from "./Hooks/useMonitorFetch";
import useCertificateFetch from "./Hooks/useCertificateFetch";
import useChecksFetch from "./Hooks/useChecksFetch";

// Constants
const BREADCRUMBS = [
	{ name: "uptime", path: "/uptime" },
	{ name: "details", path: "" },
	// { name: "details", path: `/uptime/${monitorId}` }, Is this needed?  We can't click on this anywy
];

const certificateDateFormat = "MMM D, YYYY h A";

const UptimeDetails = () => {
	// Redux state
	const { authToken } = useSelector((state) => state.auth);
	const uiTimezone = useSelector((state) => state.ui.timezone);

	// Local state
	const [dateRange, setDateRange] = useState("day");
	const [hoveredUptimeData, setHoveredUptimeData] = useState(null);
	const [hoveredIncidentsData, setHoveredIncidentsData] = useState(null);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);

	// Utils
	const dateFormat = dateRange === "day" ? "MMM D, h A" : "MMM D";
	const { monitorId } = useParams();
	const theme = useTheme();
	const isAdmin = useIsAdmin();

	const { monitor, monitorIsLoading } = useMonitorFetch({
		authToken,
		monitorId,
		dateRange,
	});

	const { certificateExpiry, certificateIsLoading } = useCertificateFetch({
		monitor,
		authToken,
		monitorId,
		certificateDateFormat,
		uiTimezone,
	});

	const { checks, checksCount, checksAreLoading } = useChecksFetch({
		authToken,
		monitorId,
		dateRange,
		page,
		rowsPerPage,
	});

	// Handlers
	const handlePageChange = (_, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(event.target.value);
	};

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<MonitorHeader
				isAdmin={isAdmin}
				shouldRender={!monitorIsLoading}
				monitor={monitor}
			/>
			<StatusBoxes
				shouldRender={!monitorIsLoading}
				monitor={monitor}
				certificateExpiry={certificateExpiry}
			/>
			<TimeFramePicker
				shouldRender={!monitorIsLoading}
				dateRange={dateRange}
				setDateRange={setDateRange}
			/>
			<ChartBoxes
				shouldRender={!monitorIsLoading}
				monitor={monitor}
				uiTimezone={uiTimezone}
				dateRange={dateRange}
				dateFormat={dateFormat}
				hoveredUptimeData={hoveredUptimeData}
				setHoveredUptimeData={setHoveredUptimeData}
				hoveredIncidentsData={hoveredIncidentsData}
				setHoveredIncidentsData={setHoveredIncidentsData}
			/>
			<ResponseTimeChart
				shouldRender={!monitorIsLoading}
				monitor={monitor}
				dateRange={dateRange}
			/>
			<ResponseTable
				shouldRender={!checksAreLoading}
				checks={checks}
				uiTimezone={uiTimezone}
				page={page}
				setPage={handlePageChange}
				rowsPerPage={rowsPerPage}
				setRowsPerPage={handleChangeRowsPerPage}
				checksCount={checksCount}
			/>
		</Stack>
	);
};

export default UptimeDetails;
