// Components
import { Stack } from "@mui/material";
import Breadcrumbs from "@/Components/v1/Breadcrumbs/index.jsx";
import GenericFallback from "@/Components/v1/GenericFallback/index.jsx";
import IncidentTable from "./Components/IncidentTable/index.jsx";
import OptionsHeader from "./Components/OptionsHeader/index.jsx";
import StatusBoxes from "./Components/StatusBoxes/index.jsx";
import { Box, Button } from "@mui/material";

//Utils
import { useTheme } from "@emotion/react";
import { useFetchMonitorsByTeamId } from "@/Hooks/monitorHooks.js";
import { useFetchChecksSummaryByTeamId } from "@/Hooks/checkHooks.js";
import { useState, useEffect } from "react";
import NetworkError from "@/Components/v1/GenericFallback/NetworkError.jsx";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

//Constants
const Checks = () => {
	// Redux state
	const { t } = useTranslation();

	const BREADCRUMBS = [{ name: t("checksPageTitle"), path: "/checks" }];

	// Local state
	const [selectedMonitor, setSelectedMonitor] = useState("0");
	const [filter, setFilter] = useState(undefined);
	const [dateRange, setDateRange] = useState(undefined);
	const [monitorLookup, setMonitorLookup] = useState(undefined);
	const [updateTrigger, setUpdateTrigger] = useState(false);

	//Hooks

	//Utils
	const theme = useTheme();
	const [monitors, , isLoading, networkError] = useFetchMonitorsByTeamId({});
	const [summary, isLoadingSummary, networkErrorSummary] = useFetchChecksSummaryByTeamId({
		updateTrigger,
	});
	const { monitorId } = useParams();

	useEffect(() => {
		if (monitorId) {
			setSelectedMonitor(monitorId);
		}
	}, [monitorId]);

	useEffect(() => {
		const monitorLookup = monitors?.reduce((acc, monitor) => {
			acc[monitor.id] = {
				id: monitor.id,
				name: monitor.name,
				type: monitor.type,
			};
			return acc;
		}, {});
		setMonitorLookup(monitorLookup);
	}, [monitors]);

	if (networkError || networkErrorSummary) {
		return (
			<GenericFallback>
				<NetworkError />
			</GenericFallback>
		);
	}

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />

			<StatusBoxes
				isLoading={isLoadingSummary}
				summary={summary}
			/>
			<OptionsHeader
				shouldRender={!isLoading}
				monitors={monitorLookup}
				selectedMonitor={selectedMonitor}
				setSelectedMonitor={setSelectedMonitor}
				filter={filter}
				setFilter={setFilter}
				dateRange={dateRange}
				setDateRange={setDateRange}
			/>
			<IncidentTable
				isLoading={isLoading}
				monitors={monitorLookup ? monitorLookup : {}}
				selectedMonitor={selectedMonitor}
				filter={filter}
				dateRange={dateRange}
				updateTrigger={updateTrigger}
				setUpdateTrigger={setUpdateTrigger}
			/>
		</Stack>
	);
};

export default Checks;
