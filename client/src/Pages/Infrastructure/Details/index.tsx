import { BasePage, Tab, Tabs } from "@/Components/design-elements";
import { HeaderTimeRange } from "@/Components/common";
import { MonitorStatBoxes, HeaderMonitorControls } from "@/Components/monitors";
import { TabNetwork } from "@/Pages/Infrastructure/Details/Components/TabNetwork";
import { TabOverview } from "@/Pages/Infrastructure/Details/Components/TabOverview";
import { TabStorage } from "@/Pages/Infrastructure/Details/Components/TabStorage";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useGet } from "@/Hooks/UseApi";
import type { HardwareDetailsResponse } from "@/Types/Monitor";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useTranslation } from "react-i18next";
import type { DateRange } from "@/Types/Query";

const DETAILS_TABS = ["overview", "network", "storage"] as const;
type DetailsTab = (typeof DETAILS_TABS)[number];

const InfrastructureDetails = () => {
	const { t } = useTranslation();
	const isAdmin = useIsAdmin();

	const { monitorId } = useParams<{ monitorId: string }>();

	const [dateRange, setDateRange] = useState<DateRange>("recent");
	// ?tab=storage opens a tab directly, e.g. when coming back from a drive's page
	const [searchParams] = useSearchParams();
	const [selectedTab, setSelectedTab] = useState<number>(() =>
		Math.max(0, DETAILS_TABS.indexOf(searchParams.get("tab") as DetailsTab))
	);

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

	const monitor = monitorDetailsData?.monitor;
	const monitorStats = monitorDetailsData?.monitorStats ?? null;
	const stats = monitorDetailsData?.stats;

	return (
		<BasePage>
			<HeaderMonitorControls
				path="infrastructure"
				monitor={monitor}
				isAdmin={isAdmin}
				refetch={refetchMonitor}
			/>
			<MonitorStatBoxes
				monitor={monitor}
				monitorStats={monitorStats}
			/>
			<HeaderTimeRange
				isLoading={monitorIsLoading}
				hasDateRange={true}
				dateRange={dateRange}
				setDateRange={setDateRange}
			/>
			<Tabs
				value={selectedTab}
				onChange={(_e, value) => {
					setSelectedTab(value);
				}}
			>
				<Tab label={t("pages.infrastructure.tabs.labels.overview")} />
				<Tab label={t("pages.infrastructure.tabs.labels.network")} />
				<Tab label={t("pages.infrastructure.tabs.labels.storage")} />
			</Tabs>
			{selectedTab === 0 && (
				<TabOverview
					monitor={monitor}
					stats={stats}
					dateRange={dateRange}
					raid={monitorDetailsData?.raid}
					drives={monitorDetailsData?.drives}
				/>
			)}
			{selectedTab === 1 && (
				<TabNetwork
					stats={stats}
					dateRange={dateRange}
				/>
			)}
			{selectedTab === 2 && (
				<TabStorage
					monitor={monitor}
					raid={monitorDetailsData?.raid}
					drives={monitorDetailsData?.drives}
				/>
			)}
		</BasePage>
	);
};

export default InfrastructureDetails;
