import { BasePage } from "@/Components/v2/design-elements";
import { HeaderMonitorControls } from "@/Components/v2/common";

import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGet } from "@/Hooks/UseApi";
import type { MonitorDetailsResponse } from "@/Types/Monitor";
import type { ChecksResponse } from "@/Types/Check";
import type { RootState } from "@/Types/state";
import useCertificateFetch from "./Hooks/useCertificateFetch";

const certificateDateFormat = "MMM D, YYYY h A";

const UptimeDetailsPage = () => {
	const isAdmin = useIsAdmin();
	const { monitorId } = useParams<{ monitorId: string }>();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);

	const [page, setPage] = useState<number>(0);
	const [rowsPerPage, setRowsPerPage] = useState<number>(5);
	const [dateRange, setDateRange] = useState<string>("recent");

	const monitorDetailsUrl = useMemo(() => {
		if (!monitorId) {
			return null;
		}
		const params = new URLSearchParams();
		params.append("dateRange", dateRange);
		params.append("normalize", "true");
		return `/monitors/uptime/details/${monitorId}?${params.toString()}`;
	}, [monitorId, dateRange]);

	const {
		data: monitorDetailsData,
		isLoading: monitorIsLoading,
		error: monitorError,
		refetch: refetchMonitor,
	} = useGet<MonitorDetailsResponse>(monitorDetailsUrl);

	const monitorData = monitorDetailsData?.monitorData;
	const monitor = monitorData?.monitor;
	const monitorStats = monitorDetailsData?.monitorStats ?? null;

	const [certificateExpiry] = useCertificateFetch({
		monitor,
		monitorId,
		certificateDateFormat,
		uiTimezone,
	});

	const checksUrl = useMemo(() => {
		if (!monitorId || !monitor?.type) {
			return null;
		}
		const params = new URLSearchParams();
		params.append("type", monitor.type);
		params.append("sortOrder", "desc");
		params.append("dateRange", dateRange);
		params.append("page", String(page));
		params.append("rowsPerPage", String(rowsPerPage));
		return `/checks/${monitorId}?${params.toString()}`;
	}, [monitorId, monitor?.type, dateRange, page, rowsPerPage]);

	const {
		data: checksData,
		isLoading: checksIsLoading,
		error: checksError,
	} = useGet<ChecksResponse>(checksUrl);

	const checks = checksData?.checks ?? [];
	const checksCount = checksData?.checksCount ?? 0;

	// TODO: Add UI components here
	// Placeholder to consume all data fetching results
	console.log({
		monitorIsLoading,
		monitorError,
		refetchMonitor,
		monitorStats,
		certificateExpiry,
		checksIsLoading,
		checksError,
		checks,
		checksCount,
		setPage,
		setRowsPerPage,
		setDateRange,
	});

	if (!monitor) {
		return null;
	}

	return (
		<BasePage>
			<HeaderMonitorControls
				path="uptime"
				monitor={monitor}
				isAdmin={isAdmin}
			/>
		</BasePage>
	);
};

export default UptimeDetailsPage;
