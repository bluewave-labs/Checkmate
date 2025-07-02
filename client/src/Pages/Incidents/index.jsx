// Components
import { Stack } from "@mui/material";
import Breadcrumbs from "../../Components/Breadcrumbs";
import GenericFallback from "../../Components/GenericFallback";
import IncidentTable from "./Components/IncidentTable";
import OptionsHeader from "./Components/OptionsHeader";
import StatusBoxes from "./Components/StatusBoxes";
import { Box, Button } from "@mui/material";
import { createToast } from "../../Utils/toastUtils";

//Utils
import { useTheme } from "@emotion/react";
import { useFetchMonitorsByTeamId } from "../../Hooks/monitorHooks";
import { useFetchChecksSummaryByTeamId } from "../../Hooks/checkHooks";
import { useState, useEffect } from "react";
import NetworkError from "../../Components/GenericFallback/NetworkError";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { networkService } from "../../Utils/NetworkService";

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

	const handleAckAllChecks = async () => {
		try {
			await networkService.updateAllChecksStatus({ ack: true });
			setUpdateTrigger((prev) => !prev);
		} catch (error) {
			createToast({ body: "Failed to resolve all incidents." });
		}
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
					onClick={handleAckAllChecks}
				>
					{t("incidentsPageActionResolve")}
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
