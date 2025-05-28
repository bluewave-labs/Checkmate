// Components
import { Stack } from "@mui/material";
import Breadcrumbs from "../../Components/Breadcrumbs";

//Utils
import { useTheme } from "@emotion/react";
import { useMonitorsFetch } from "./Hooks/useMonitorsFetch";
import { useSelector } from "react-redux";
import OptionsHeader from "./Components/OptionsHeader";
import { useState } from "react";
import IncidentTable from "./Components/IncidentTable";
import GenericFallback from "../../Components/GenericFallback";
import NetworkError from "../../Components/GenericFallback/NetworkError";
import { useTranslation } from "react-i18next";
//Constants

const Incidents = () => {
	// Redux state
	const { user } = useSelector((state) => state.auth);
	const { t } = useTranslation();

	const BREADCRUMBS = [
		{ name: t("incidentsPageTitle", "Incidents"), path: "/incidents" },
	];

	// Local state
	const [selectedMonitor, setSelectedMonitor] = useState("0");
	const [filter, setFilter] = useState(undefined);
	const [dateRange, setDateRange] = useState(undefined);
	//Utils
	const theme = useTheme();

	const { monitors, isLoading, networkError } = useMonitorsFetch({
		teamId: user.teamId,
	});

	if (networkError) {
		return (
			<GenericFallback>
				<NetworkError />
			</GenericFallback>
		);
	}

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<OptionsHeader
				shouldRender={!isLoading}
				monitors={monitors}
				selectedMonitor={selectedMonitor}
				setSelectedMonitor={setSelectedMonitor}
				filter={filter}
				setFilter={setFilter}
				dateRange={dateRange}
				setDateRange={setDateRange}
			/>
			<IncidentTable
				shouldRender={!isLoading}
				monitors={monitors}
				selectedMonitor={selectedMonitor}
				filter={filter}
				dateRange={dateRange}
			/>
		</Stack>
	);
};

export default Incidents;
