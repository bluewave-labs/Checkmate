// Components
import Breadcrumbs from "../../../Components/Breadcrumbs";
import MonitorDetailsControlHeader from "../../../Components/MonitorDetailsControlHeader";
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
import useFetchUptimeMonitorDetails from "../../../Hooks/useFetchUptimeMonitorDetails";
import useCertificateFetch from "./Hooks/useCertificateFetch";
import useChecksFetch from "./Hooks/useChecksFetch";
import { useTranslation } from "react-i18next";

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
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);
	const [trigger, setTrigger] = useState(false);

	// Utils
	const dateFormat =
		dateRange === "day" || dateRange === "recent" ? "MMM D, h A" : "MMM D";
	const { monitorId } = useParams();
	const theme = useTheme();
	const isAdmin = useIsAdmin();
	const { t } = useTranslation();

	const [monitorData, monitorStats, monitorIsLoading, monitorNetworkError] =
		useFetchUptimeMonitorDetails({
			monitorId,
			dateRange,
			trigger,
		});

	const monitor = monitorData?.monitor;

	const [certificateExpiry, certificateIsLoading] = useCertificateFetch({
		monitor,
		monitorId,
		certificateDateFormat,
		uiTimezone,
	});

	const monitorType = monitor?.type;
	const [checks, checksCount, checksAreLoading, checksNetworkError] = useChecksFetch({
		monitorId,
		monitorType,
		dateRange,
		page,
		rowsPerPage,
	});

	// Handlers
	const triggerUpdate = () => {
		console.log("trigger update");
		setTrigger(!trigger);
	};

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
					{t("networkError")}
				</Typography>
				<Typography>{t("checkConnection")}</Typography>
			</GenericFallback>
		);
	}

	// Empty view, displayed when loading is complete and there are no checks
	if (!monitorIsLoading && !checksAreLoading && checksCount === 0) {
		return (
			<Stack gap={theme.spacing(10)}>
				<Breadcrumbs list={BREADCRUMBS} />
				<MonitorDetailsControlHeader
					path={"uptime"}
					isAdmin={isAdmin}
					isLoading={monitorIsLoading}
					monitor={monitor}
					triggerUpdate={triggerUpdate}
				/>
				<GenericFallback>
					<Typography>{t("distributedUptimeDetailsNoMonitorHistory")}</Typography>
				</GenericFallback>
			</Stack>
		);
	}

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<MonitorDetailsControlHeader
				path={"uptime"}
				isAdmin={isAdmin}
				isLoading={monitorIsLoading}
				monitor={monitor}
				triggerUpdate={triggerUpdate}
			/>
			<UptimeStatusBoxes
				isLoading={monitorIsLoading}
				monitor={monitor}
				monitorStats={monitorStats}
				certificateExpiry={certificateExpiry}
			/>
			<MonitorTimeFrameHeader
				isLoading={monitorIsLoading}
				hasDateRange={true}
				dateRange={dateRange}
				setDateRange={setDateRange}
			/>
			<ChartBoxes
				isLoading={monitorIsLoading}
				monitorData={monitorData}
				uiTimezone={uiTimezone}
				dateRange={dateRange}
				dateFormat={dateFormat}
			/>
			<ResponseTimeChart
				isLoading={monitorIsLoading}
				groupedChecks={monitorData?.groupedChecks}
				dateRange={dateRange}
			/>
			<ResponseTable
				isLoading={checksAreLoading}
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
