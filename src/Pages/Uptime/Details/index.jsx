// Components
import Breadcrumbs from "../../../Components/Breadcrumbs";
import MonitorStatusHeader from "../../../Components/MonitorStatusHeader";
import MonitorTimeFrameHeader from "../../../Components/MonitorTimeFrameHeader";
import ChartBoxes from "./Components/ChartBoxes";
import ResponseTimeChart from "./Components/Charts/ResponseTimeChart";
import ResponseTable from "./Components/ResponseTable";
import UptimeStatusBoxes from "./Components/UptimeStatusBoxes";
import GenericFallback from "../../../Components/GenericFallback";
// MUI Components
import { Stack, Typography } from "@mui/material";

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
	const uiTimezone = useSelector((state) => state.ui.timezone);

	// Local state
	const [dateRange, setDateRange] = useState("recent");
	const [hoveredUptimeData, setHoveredUptimeData] = useState(null);
	const [hoveredIncidentsData, setHoveredIncidentsData] = useState(null);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);

	// Utils
	const dateFormat =
		dateRange === "day" || dateRange === "recent" ? "MMM D, h A" : "MMM D";
	const { monitorId } = useParams();
	const theme = useTheme();
	const isAdmin = useIsAdmin();

	const [monitor, monitorIsLoading, monitorNetworkError] = useMonitorFetch({
		monitorId,
		dateRange,
	});

	const [certificateExpiry, certificateIsLoading] = useCertificateFetch({
		monitor,
		monitorId,
		certificateDateFormat,
		uiTimezone,
	});

	const [checks, checksCount, checksAreLoading, checksNetworkError] = useChecksFetch({
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

	if (monitorNetworkError || checksNetworkError) {
		return (
			<GenericFallback>
				<Typography
					variant="h1"
					marginY={theme.spacing(4)}
					color={theme.palette.primary.contrastTextTertiary}
				>
					Network error
				</Typography>
				<Typography>Please check your connection</Typography>
			</GenericFallback>
		);
	}

	// Empty view, displayed when loading is complete and there are no checks
	if (!monitorIsLoading && !checksAreLoading && checksCount === 0) {
		return (
			<Stack gap={theme.spacing(10)}>
				<Breadcrumbs list={BREADCRUMBS} />
				<MonitorStatusHeader
					path={"uptime"}
					isAdmin={isAdmin}
					shouldRender={!monitorIsLoading}
					monitor={monitor}
				/>
				<GenericFallback>
					<Typography>There is no check history for this monitor yet.</Typography>
				</GenericFallback>
			</Stack>
		);
	}

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<MonitorStatusHeader
				path={"uptime"}
				isAdmin={isAdmin}
				shouldRender={!monitorIsLoading}
				monitor={monitor}
			/>
			<UptimeStatusBoxes
				shouldRender={!monitorIsLoading}
				monitor={monitor}
				certificateExpiry={certificateExpiry}
			/>
			<MonitorTimeFrameHeader
				shouldRender={!monitorIsLoading}
				hasDateRange={true}
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
