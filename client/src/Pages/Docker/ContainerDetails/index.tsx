// Components
import { BasePage, Tabs, Tab, DockerStateLabel } from "@/Components/design-elements";
import { TabOverview } from "@/Pages/Docker/ContainerDetails/TabOverview";
import { TabLogs } from "@/Pages/Docker/ContainerDetails/TabLogs";

// Hooks
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGet } from "@/Hooks/UseApi";
import type { DockerContainerResponse } from "@/Types/Monitor";
import { DockerContainerStatusBoxes } from "@/Pages/Docker/ContainerDetails/Components/StatBoxes";
import type { DateRange } from "@/Types/Query";
import { HeaderTimeRange } from "@/Components/common";
interface DockerContainerDetailsProps {
	open?: "overview" | "logs";
}

const TAB_MAP = {
	overview: 0,
	logs: 1,
} as const;

const DockerDetailsPage = ({ open = "overview" }: DockerContainerDetailsProps) => {
	const [activeTab, setActiveTab] = useState<number>(TAB_MAP[open]);
	const [dateRange, setDateRange] = useState<DateRange>("recent");
	const { monitorId, containerName } = useParams<{
		monitorId: string;
		containerName: string;
	}>();
	const { t } = useTranslation();

	const containerDetailsUrl = monitorId
		? `/monitors/docker/details/${monitorId}/containers/${containerName}?dateRange=${dateRange}`
		: null;

	const { data: containerData } = useGet<DockerContainerResponse>(
		containerDetailsUrl,
		{},
		{ refreshInterval: 10000, keepPreviousData: true }
	);

	const monitor = containerData?.monitor;
	if (!monitor) return null;

	const stats = containerData.stats;

	const container = stats?.latest?.container;
	if (!container) return null;

	const { state, name, image } = container;

	return (
		<BasePage headerKey="docker.container">
			<DockerStateLabel
				state={state}
				name={name}
				image={image}
			/>
			<DockerContainerStatusBoxes container={container} />
			<HeaderTimeRange
				dateRange={dateRange}
				setDateRange={setDateRange}
			/>
			<Tabs
				value={activeTab}
				onChange={(_, newValue: number) => setActiveTab(newValue)}
			>
				<Tab label={t("pages.docker.container.tabs.overview")} />
				<Tab label={t("pages.docker.container.tabs.logs")} />
			</Tabs>
			{activeTab === 0 && <TabOverview stats={stats} />}
			{activeTab === 1 && <TabLogs />}
		</BasePage>
	);
};

export default DockerDetailsPage;
