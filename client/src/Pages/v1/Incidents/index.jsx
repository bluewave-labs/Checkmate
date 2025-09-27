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
import { useFetchMonitorsByTeamId } from "../../../Hooks/v1/monitorHooks.js";
import { useFetchChecksSummaryByTeamId } from "../../../Hooks/v1/checkHooks.js";
import { useAcknowledgeChecks } from "../../../Hooks/v1/checkHooks.js";
import { useState, useEffect } from "react";
import NetworkError from "@/Components/v1/GenericFallback/NetworkError.jsx";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

//Constants
const Incidents = () => {
	// Redux state
	const { t } = useTranslation();

	const BREADCRUMBS = [
		{ name: t("incidentsPageTitle", "Incidents"), path: "/incidents" },
	];

	// Local state
	const [selectedMonitor, setSelectedMonitor] = useState("0");
	const [filter, setFilter] = useState(undefined);
	const [dateRange, setDateRange] = useState(undefined);
	const [monitorLookup, setMonitorLookup] = useState(undefined);
	const [updateTrigger, setUpdateTrigger] = useState(false);

	//Hooks
	const { acknowledge, isLoadingAcknowledge } = useAcknowledgeChecks();

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
			acc[monitor._id] = {
				_id: monitor._id,
				name: monitor.name,
				type: monitor.type,
			};
			return acc;
		}, {});
		setMonitorLookup(monitorLookup);
	}, [monitors]);

	const handleAcknowledge = () => {
		const monitorId = selectedMonitor === "0" ? null : selectedMonitor;
		acknowledge(setUpdateTrigger, monitorId);
	};

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
			<Box alignSelf="flex-end">
				<Button
					variant="contained"
					color="accent"
					onClick={handleAcknowledge}
					disabled={isLoadingAcknowledge}
				>
					{selectedMonitor === "0"
						? t("incidentsPageActionResolveAll")
						: t("incidentsPageActionResolveMonitor")}
				</Button>
			</Box>
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

export default Incidents;
