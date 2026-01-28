import { BasePage, Tab, Tabs } from "@/Components/v2/design-elements";
import { HeaderMonitorControls, HeaderTimeRange } from "@/Components/v2/common";
import Stack from "@mui/material/Stack";
import { MonitorStatBoxes } from "@/Components/v2/monitors";
import { TabNetwork } from "@/Pages/Infrastructure/Details/Components/TabNetwork";
import { TabOverview } from "@/Pages/Infrastructure/Details/Components/TabOverview";

import { useTheme } from "@mui/material";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useGet } from "@/Hooks/UseApi";
import type { HardwareDetailsResponse } from "@/Types/Monitor";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useTranslation } from "react-i18next";

const InfrastructureDetails = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isAdmin = useIsAdmin();

	const { monitorId } = useParams<{ monitorId: string }>();

	const [dateRange, setDateRange] = useState<string>("recent");
	const [selectedTab, setSelectedTab] = useState<number>(0);

	const monitorDetailsUrl = useMemo(() => {
		if (!monitorId) {
			return null;
		}
		const params = new URLSearchParams();
		params.append("dateRange", dateRange);
		return `/monitors/hardware/details/${monitorId}?${params.toString()}`;
	}, [monitorId, dateRange]);

	const {
		data: monitorDetailsData,
		isLoading: monitorIsLoading,
		refetch: refetchMonitor,
	} = useGet<HardwareDetailsResponse>(
		monitorDetailsUrl,
		{},
		{ refreshInterval: 10000, keepPreviousData: true }
	);

	console.log(monitorDetailsData);

	const monitor = monitorDetailsData?.monitor;
	const monitorStats = monitorDetailsData?.monitorStats ?? null;

	return (
		<BasePage>
			<HeaderMonitorControls
				path="hardware"
				monitor={monitor}
				isAdmin={isAdmin}
				refetch={refetchMonitor}
			/>
			<MonitorStatBoxes
				monitor={monitor}
				monitorStats={monitorStats}
			/>
			<Tabs
				value={selectedTab}
				onChange={(_e, value) => {
					setSelectedTab(value);
				}}
			>
				<Tab label={t("pages.infrastructure.tabs.labels.overview")} />
				<Tab label={t("pages.infrastructure.tabs.labels.network")} />
			</Tabs>
			{selectedTab === 0 && <TabOverview monitor={monitor} />}
			{selectedTab === 1 && <TabNetwork />}
		</BasePage>
	);
};

export default InfrastructureDetails;
