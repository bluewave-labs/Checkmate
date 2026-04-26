import { BasePage, EmptyState } from "@/Components/design-elements";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { useTranslation } from "react-i18next";
import {
	SummaryCardActiveIncidents,
	SummaryCardLatestIncidents,
	SummaryCardStats,
} from "@/Pages/Incidents/Components/CardSummary";
import { IncidentsTable } from "@/Pages/Incidents/Components/IncidentTable";
import { DialogResolution } from "@/Pages/Incidents/Components/DialogResolution";
import { DialogIncidentDetails } from "@/Pages/Incidents/Components/DialogIncidentDetails";
import { HeaderTimeRange } from "@/Components/common";
import { ControlsIncidentFilter } from "@/Pages/Incidents/Components/ControlsIncidentFilter";

import { useGet } from "@/Hooks/UseApi";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import type { Incident, IncidentsResponse, IncidentSummary } from "@/Types/Incident";
import type { Monitor } from "@/Types/Monitor";
import { useTheme } from "@mui/material";

const IncidentsPage = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { monitorId } = useParams();

	// Filter state
	const [selectedMonitor, setSelectedMonitor] = useState(monitorId || "0");
	const [filter, setFilter] = useState("all");
	const [dateRange, setDateRange] = useState("recent");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [activeIncidentsPage, setActiveIncidentsPage] = useState(0);
	const [activeIncidentsRowsPerPage, setActiveIncidentsRowsPerPage] = useState(5);

	// Resolve dialog state
	const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
	const [resolveIncidentId, setResolveIncidentId] = useState<string | null>(null);

	// Details dialog state
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
	const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
	const [selectedIncidentMonitor, setSelectedIncidentMonitor] = useState<Monitor | null>(
		null
	);

	// Build incidents URL with query params
	const incidentsUrl = useMemo(() => {
		const params = new URLSearchParams();
		if (selectedMonitor !== "0") params.append("monitorId", selectedMonitor);
		// Always show only resolved incidents (active ones are in the separate table above)
		params.append("status", "false");
		if (filter === "manual" || filter === "automatic")
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
		refetch: refetchIncidents,
	} = useGet<IncidentsResponse>(
		incidentsUrl,
		{},
		{ keepPreviousData: true, refreshInterval: 10000 }
	);

	// Fetch monitors for lookup
	const { data: monitorsData } = useGet<Monitor[]>("/monitors/team");

	// Build active incidents URL (always fetch all active, no date filter)
	const activeIncidentsUrl = useMemo(() => {
		const params = new URLSearchParams();
		if (selectedMonitor !== "0") params.append("monitorId", selectedMonitor);
		params.append("status", "true");
		params.append("sortOrder", "desc");
		params.append("page", String(activeIncidentsPage));
		params.append("rowsPerPage", String(activeIncidentsRowsPerPage));
		return `/incidents/team?${params.toString()}`;
	}, [selectedMonitor, activeIncidentsPage, activeIncidentsRowsPerPage]);

	// Fetch active incidents
	const { data: activeIncidentsData, refetch: refetchActiveIncidents } =
		useGet<IncidentsResponse>(
			activeIncidentsUrl,
			{},
			{ keepPreviousData: true, refreshInterval: 10000 }
		);

	// Fetch incident summary
	const { data: summaryData, refetch: refetchSummary } = useGet<IncidentSummary>(
		"/incidents/team/summary"
	);

	// Reset page when filters change
	useEffect(() => {
		setPage(0);
	}, [selectedMonitor, filter, dateRange]);

	// Derived state
	const incidents = incidentsData?.incidents ?? [];
	const incidentsCount = incidentsData?.count ?? 0;
	const activeIncidents = activeIncidentsData?.incidents ?? [];
	const activeIncidentsCount = activeIncidentsData?.count ?? 0;

	const handleClearFilters = () => {
		setSelectedMonitor("0");
		setFilter("all");
	};

	const handleOpenDetails = (incidentId: string) => {
		const incident =
			incidents.find((i) => i.id === incidentId) ??
			activeIncidents.find((i) => i.id === incidentId) ??
			null;
		const monitor = monitorsData?.find((m) => m.id === incident?.monitorId) ?? null;
		setIsDetailsDialogOpen(true);
		setSelectedIncident(incident);
		setSelectedIncidentMonitor(monitor);
	};

	const handleDetailsClose = () => {
		setIsDetailsDialogOpen(false);
	};

	const handleDetailsResolve = () => {
		if (selectedIncident) {
			handleDetailsClose();
			handleResolve(selectedIncident.id);
		}
	};

	const handleResolve = (incidentId: string) => {
		setResolveIncidentId(incidentId);
		setIsResolveDialogOpen(true);
	};

	const handleResolveClose = () => {
		setIsResolveDialogOpen(false);
		setResolveIncidentId(null);
	};

	const handleResolved = () => {
		refetchIncidents();
		refetchActiveIncidents();
		refetchSummary();
	};

	const trulyEmpty = summaryData !== undefined && (summaryData?.total ?? 0) === 0;

	if (trulyEmpty) {
		return (
			<EmptyState
				fullscreen
				title={t("pages.incidents.fallback.title")}
				description={t("pages.incidents.fallback.description")}
			/>
		);
	}

	return (
		<BasePage headerKey="incidents">
			<Stack
				direction={{ xs: "column", md: "row" }}
				gap={theme.spacing(8)}
			>
				<SummaryCardActiveIncidents summary={summaryData} />
				<SummaryCardLatestIncidents summary={summaryData} />
				<SummaryCardStats summary={summaryData} />
			</Stack>
			<ControlsIncidentFilter
				monitors={monitorsData ?? undefined}
				selectedMonitor={selectedMonitor}
				setSelectedMonitor={setSelectedMonitor}
				selectedResolutionType={filter}
				setSelectedResolutionType={setFilter}
				onClearFilters={handleClearFilters}
			/>
			{activeIncidentsCount > 0 && (
				<>
					<Typography
						variant="h6"
						sx={{ mb: theme.spacing(4), textTransform: "uppercase" }}
					>
						{t("pages.incidents.table.activeIncidents")}
					</Typography>

					<IncidentsTable
						incidents={activeIncidents}
						monitors={monitorsData ?? undefined}
						incidentsCount={activeIncidentsCount}
						page={activeIncidentsPage}
						setPage={setActiveIncidentsPage}
						rowsPerPage={activeIncidentsRowsPerPage}
						setRowsPerPage={setActiveIncidentsRowsPerPage}
						onOpenDetails={handleOpenDetails}
						onResolve={handleResolve}
					/>
					<Divider />
				</>
			)}

			<Typography
				variant="h6"
				sx={{ mb: theme.spacing(4), textTransform: "uppercase" }}
			>
				{t("pages.incidents.table.resolvedIncidents")}
			</Typography>

			<HeaderTimeRange
				dateRange={dateRange}
				setDateRange={setDateRange}
				isLoading={isLoadingIncidents}
			/>
			<IncidentsTable
				incidents={incidents}
				monitors={monitorsData ?? undefined}
				incidentsCount={incidentsCount}
				page={page}
				setPage={setPage}
				rowsPerPage={rowsPerPage}
				setRowsPerPage={setRowsPerPage}
				onOpenDetails={handleOpenDetails}
				onResolve={handleResolve}
			/>
			<DialogResolution
				open={isResolveDialogOpen}
				incidentId={resolveIncidentId}
				onClose={handleResolveClose}
				onResolved={handleResolved}
			/>
			<DialogIncidentDetails
				open={isDetailsDialogOpen}
				incident={selectedIncident}
				monitor={selectedIncidentMonitor}
				onClose={handleDetailsClose}
				onResolve={handleDetailsResolve}
			/>
		</BasePage>
	);
};

export default IncidentsPage;
