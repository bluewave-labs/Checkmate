import { BasePage } from "@/Components/v2/design-elements";
import { HeaderTimeRange } from "@/Components/v2/common";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import {
	HistogramStatus,
	RadialAvgResponse,
	HistogramDetails,
	HeaderMonitorControls,
} from "@/Components/v2/monitors";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { ChecksTable } from "@/Pages/Uptime/Details/Components/ChecksTable";
import { MonitorStatBoxes } from "@/Components/v2/monitors";

import { useTheme } from "@mui/material/styles";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGet } from "@/Hooks/UseApi";
import type { MonitorDetailsResponse, LocationCheckData } from "@/Types/Monitor";
import type { ChecksResponse } from "@/Types/Check";
import type { RootState } from "@/Types/state";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import { t } from "i18next";

const certificateDateFormat = "MMM D, YYYY h A";

interface CertificateResponse {
	certificateDate: string;
}

const UptimeDetailsPage = () => {
	const theme = useTheme();
	const isAdmin = useIsAdmin();
	const { monitorId } = useParams<{ monitorId: string }>();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);

	const [page, setPage] = useState<number>(0);
	const [rowsPerPage, setRowsPerPage] = useState<number>(5);
	const [dateRange, setDateRange] = useState<string>("recent");
	const [selectedLocationTab, setSelectedLocationTab] = useState<number>(0);

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
		refetch: refetchMonitor,
	} = useGet<MonitorDetailsResponse>(
		monitorDetailsUrl,
		{},
		{ refreshInterval: 10000, keepPreviousData: true }
	);

	const monitorData = monitorDetailsData?.monitorData;
	const monitor = monitorData?.monitor;
	const monitorStats = monitorDetailsData?.monitorStats ?? null;

	// Certificate fetch - only for HTTP monitors
	const certificateUrl = useMemo(() => {
		if (!monitorId || monitor?.type !== "http") {
			return null;
		}
		return `/monitors/certificate/${monitorId}`;
	}, [monitorId, monitor?.type]);

	const { data: certificateData } = useGet<CertificateResponse>(certificateUrl);

	const certificateExpiry = useMemo(() => {
		if (!certificateData?.certificateDate) {
			return undefined;
		}
		return (
			formatDateWithTz(
				certificateData.certificateDate,
				certificateDateFormat,
				uiTimezone
			) ?? "N/A"
		);
	}, [certificateData, uiTimezone]);

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

	const { data: checksData, isLoading: checksIsLoading } = useGet<ChecksResponse>(
		checksUrl,
		{},
		{ keepPreviousData: true }
	);

	const checks = checksData?.checks ?? [];
	const checksCount = checksData?.checksCount ?? 0;

	const { data: globalpingData } = useGet<{
		locations: { id: string; label: string }[];
		labels: Record<string, string>;
	}>("/monitors/globalping/locations");
	const locationLabels = globalpingData?.labels ?? {};

	const locationChecks = monitorData?.locationChecks;
	const locationKeys = useMemo(
		() => (locationChecks ? Object.keys(locationChecks).sort() : []),
		[locationChecks]
	);
	const selectedLocation = locationKeys[selectedLocationTab] ?? null;
	const selectedLocationData: LocationCheckData | null =
		selectedLocation && locationChecks ? locationChecks[selectedLocation] : null;

	return (
		<BasePage>
			<HeaderMonitorControls
				path="uptime"
				monitor={monitor}
				isAdmin={isAdmin}
				refetch={refetchMonitor}
			/>
			<MonitorStatBoxes
				monitor={monitor}
				monitorStats={monitorStats}
				certificateExpiry={certificateExpiry}
			/>
			<HeaderTimeRange
				isLoading={monitorIsLoading || checksIsLoading}
				hasDateRange={true}
				dateRange={dateRange}
				setDateRange={setDateRange}
			/>
			<Stack
				direction={{ xs: "column", md: "row" }}
				gap={theme.spacing(8)}
			>
				<HistogramStatus
					title={t("common.charts.labels.uptime")}
					icon={<TrendingUp />}
					checks={monitorData?.groupedUpChecks ?? []}
					range={dateRange}
				/>
				<HistogramStatus
					title={t("common.charts.labels.downtime")}
					icon={<AlertTriangle />}
					checks={monitorData?.groupedDownChecks ?? []}
					range={dateRange}
				/>
				<RadialAvgResponse
					avg={monitorStats?.avgResponseTime || 0}
					max={500}
				/>
			</Stack>
			<HistogramDetails
				checks={monitorData?.groupedChecks || []}
				range={dateRange}
			/>
			{locationKeys.length > 0 && (
				<Box>
					<Typography
						variant="h2"
						sx={{ mb: theme.spacing(4) }}
					>
						{t("pages.uptime.details.locations.title")}
					</Typography>
					<Tabs
						value={selectedLocationTab}
						onChange={(_e, newVal) => setSelectedLocationTab(newVal)}
						sx={{ mb: theme.spacing(4) }}
					>
						{locationKeys.map((loc) => (
							<Tab
								key={loc}
								label={locationLabels[loc] ?? loc}
							/>
						))}
					</Tabs>
					{selectedLocationData && (
						<Stack gap={theme.spacing(4)}>
							<Stack
								direction="row"
								gap={theme.spacing(8)}
							>
								<Box>
									<Typography
										variant="body2"
										color="text.secondary"
									>
										{t("pages.uptime.details.locations.avgResponseTime")}
									</Typography>
									<Typography variant="h3">
										{Math.round(selectedLocationData.avgResponseTime)} ms
									</Typography>
								</Box>
								<Box>
									<Typography
										variant="body2"
										color="text.secondary"
									>
										{t("pages.uptime.details.locations.uptime")}
									</Typography>
									<Typography variant="h3">
										{(selectedLocationData.uptimePercentage * 100).toFixed(1)}%
									</Typography>
								</Box>
							</Stack>
							<HistogramDetails
								checks={selectedLocationData.groupedChecks || []}
								range={dateRange}
							/>
						</Stack>
					)}
				</Box>
			)}
			<ChecksTable
				checks={checks}
				count={checksCount}
				page={page}
				setPage={setPage}
				rowsPerPage={rowsPerPage}
				setRowsPerPage={setRowsPerPage}
			/>
		</BasePage>
	);
};

export default UptimeDetailsPage;
