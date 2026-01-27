import { BasePage, Breadcrumb } from "@/Components/v2/design-elements";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useGet } from "@/Hooks/UseApi";

interface MonitorLookupItem {
	id: string;
	name: string;
	type: string;
}

interface MonitorLookup {
	[key: string]: MonitorLookupItem;
}

const Checks = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { monitorId } = useParams<{ monitorId?: string }>();

	// Local state
	const [selectedMonitor, setSelectedMonitor] = useState<string>("0");
	const [filter, setFilter] = useState<boolean | undefined>(undefined);
	const [dateRange, setDateRange] = useState<string>("hour");

	// Data fetching with SWR
	const monitorsUrl = "/monitors/team";
	const summaryUrl = `/checks/team/summary?dateRange=${dateRange}`;

	const {
		data: monitorsResponse,
		isLoading: isLoadingMonitors,
		error: monitorsError,
	} = useGet<Monitor[]>(monitorsUrl);

	const {
		data: summaryResponse,
		isLoading: isLoadingSummary,
		error: summaryError,
	} = useGet<ChecksSummary>(summaryUrl);

	console.log(monitorsResponse, summaryResponse);

	return (
		<BasePage>
			<Breadcrumb />
		</BasePage>
	);
};

export default Checks;
