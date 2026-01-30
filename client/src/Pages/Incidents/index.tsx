import { BasePage } from "@/Components/v2/design-elements";
import Stack from "@mui/material/Stack";
import {
	SummaryCardActiveIncidents,
	SummaryCardLatestIncidents,
	SummaryCardStats,
} from "@/Pages/Incidents/Components/SummaryCard";

import { useGet } from "@/Hooks/UseApi";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import type { IncidentsResponse, IncidentSummary } from "@/Types/Incident";
import type { Monitor } from "@/Types/Monitor";
import { useTheme } from "@mui/material";

interface MonitorLookup {
	[key: string]: { id: string; name: string; type: string };
}

const IncidentsPage = () => {
	const theme = useTheme();
	const { monitorId } = useParams();

	// Filter state
	const [selectedMonitor, setSelectedMonitor] = useState(monitorId || "0");
	const [filter, setFilter] = useState("all");
	const [dateRange, setDateRange] = useState("all");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	// Build incidents URL with query params
	const incidentsUrl = useMemo(() => {
		const params = new URLSearchParams();
		if (selectedMonitor !== "0") params.append("monitorId", selectedMonitor);
		if (filter === "active") params.append("status", "true");
		else if (filter === "resolved") params.append("status", "false");
		else if (filter === "manual" || filter === "automatic")
			params.append("resolutionType", filter);
		params.append("sortOrder", "desc");
		if (dateRange !== "all") params.append("dateRange", dateRange);
		params.append("page", String(page));
		params.append("rowsPerPage", String(rowsPerPage));
		return `/incidents/team?${params.toString()}`;
	}, [selectedMonitor, filter, dateRange, page, rowsPerPage]);

	// Fetch incidents
	const {
		data: incidentsData,
		isLoading: isLoadingIncidents,
		error: incidentsError,
		refetch: refetchIncidents,
	} = useGet<IncidentsResponse>(incidentsUrl);

	// Fetch monitors for lookup
	const {
		data: monitorsData,
		isLoading: isLoadingMonitors,
		error: monitorsError,
	} = useGet<Monitor[]>("/monitors/team");

	// Fetch incident summary
	const {
		data: summaryData,
		isLoading: isLoadingSummary,
		error: summaryError,
		refetch: refetchSummary,
	} = useGet<IncidentSummary>("/incidents/team/summary");

	// Build monitor lookup
	const monitorLookup = useMemo<MonitorLookup | undefined>(() => {
		if (!monitorsData) return undefined;
		return monitorsData.reduce<MonitorLookup>((acc, monitor) => {
			acc[monitor.id] = {
				id: monitor.id,
				name: monitor.name,
				type: monitor.type,
			};
			return acc;
		}, {});
	}, [monitorsData]);

	// Reset page when filters change
	useEffect(() => {
		setPage(0);
	}, [selectedMonitor, filter, dateRange]);

	// Derived state
	const incidents = incidentsData?.incidents ?? [];
	const incidentsCount = incidentsData?.count ?? 0;
	const networkError = !!incidentsError || !!monitorsError || !!summaryError;

	// Expose state and handlers for future UI use
	void selectedMonitor;
	void setSelectedMonitor;
	void filter;
	void setFilter;
	void dateRange;
	void setDateRange;
	void page;
	void setPage;
	void rowsPerPage;
	void setRowsPerPage;
	void isLoadingIncidents;
	void isLoadingMonitors;
	void isLoadingSummary;
	void refetchIncidents;
	void refetchSummary;
	void monitorLookup;
	void incidents;
	void incidentsCount;
	void summaryData;
	void networkError;

	return (
		<BasePage>
			<Stack
				direction={{ xs: "column", md: "row" }}
				gap={theme.spacing(8)}
			>
				<SummaryCardActiveIncidents incidents={incidents} />
				<SummaryCardLatestIncidents
					incidents={incidents}
					monitors={monitorsData}
				/>
				<SummaryCardStats summary={summaryData} />
			</Stack>
		</BasePage>
	);
};

export default IncidentsPage;
