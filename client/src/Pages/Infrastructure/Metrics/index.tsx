import { BasePage, Tab, TabIcon, Tabs } from "@/Components/design-elements";
import { HardDrive, Layers, LayoutDashboard, Network } from "lucide-react";
import { HeaderTimeRange } from "@/Components/common";
import { MonitorStatBoxes, HeaderMonitorControls } from "@/Components/monitors";
import { TabOverview } from "@/Pages/Infrastructure/Metrics/Components/TabOverview";
import { TabDisks } from "@/Pages/Infrastructure/Metrics/Components/TabDisks";
import { TabNetwork } from "@/Pages/Infrastructure/Metrics/Components/TabNetwork";
import { TabRaid } from "@/Pages/Infrastructure/Metrics/Components/TabRaid";

import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useGet } from "@/Hooks/UseApi";
import type { HardwareMetricsResponse } from "@/Types/Monitor";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useTranslation } from "react-i18next";
import type { DateRange } from "@/Types/Query";

const InfrastructureDetails = () => {
	const { t } = useTranslation();
	const isAdmin = useIsAdmin();

	const { monitorId } = useParams<{ monitorId: string }>();

	const [dateRange, setDateRange] = useState<DateRange>("recent");
	const [selectedTab, setSelectedTab] = useState<number>(0);

	const metricsUrl = useMemo(() => {
		if (!monitorId) {
			return null;
		}
		const params = new URLSearchParams();
		params.append("dateRange", dateRange);
		return `/monitors/hardware/metrics/${monitorId}?${params.toString()}`;
	}, [monitorId, dateRange]);

	const {
		data: metrics,
		isLoading,
		refetch,
	} = useGet<HardwareMetricsResponse>(
		metricsUrl,
		{},
		{ refreshInterval: 10000, keepPreviousData: true }
	);

	const monitor = metrics?.monitor;
	const monitorStats = metrics?.monitorStats ?? null;
	const hasRaid = (metrics?.raid.length ?? 0) > 0;

	return (
		<BasePage>
			<HeaderMonitorControls
				path="infrastructure"
				monitor={monitor}
				isAdmin={isAdmin}
				refetch={refetch}
			/>
			<MonitorStatBoxes
				monitor={monitor}
				monitorStats={monitorStats}
			/>
			<HeaderTimeRange
				isLoading={isLoading}
				hasDateRange={true}
				dateRange={dateRange}
				setDateRange={setDateRange}
			/>
			<Tabs
				value={selectedTab}
				variant="scrollable"
				scrollButtons={false}
				onChange={(_e, value) => {
					setSelectedTab(value);
				}}
			>
				<Tab
					label={t("pages.infrastructure.tabs.labels.overview")}
					icon={<TabIcon icon={LayoutDashboard} />}
				/>
				<Tab
					label={t("pages.infrastructure.tabs.labels.disks")}
					icon={<TabIcon icon={HardDrive} />}
				/>
				<Tab
					label={t("pages.infrastructure.tabs.labels.network")}
					icon={<TabIcon icon={Network} />}
				/>
				{hasRaid && (
					<Tab
						label={t("pages.infrastructure.tabs.labels.raid")}
						icon={<TabIcon icon={Layers} />}
					/>
				)}
			</Tabs>
			{selectedTab === 0 && (
				<TabOverview
					metrics={metrics}
					dateRange={dateRange}
				/>
			)}
			{selectedTab === 1 && (
				<TabDisks
					metrics={metrics}
					dateRange={dateRange}
				/>
			)}
			{selectedTab === 2 && (
				<TabNetwork
					metrics={metrics}
					dateRange={dateRange}
				/>
			)}
			{selectedTab === 3 && (
				<TabRaid
					metrics={metrics}
					dateRange={dateRange}
				/>
			)}
		</BasePage>
	);
};

export default InfrastructureDetails;
