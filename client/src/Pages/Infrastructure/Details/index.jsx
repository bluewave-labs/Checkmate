// Components
import { Stack, Typography, Tab } from "@mui/material";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import MonitorDetailsControlHeader from "../../../Components/MonitorDetailsControlHeader";
import MonitorTimeFrameHeader from "../../../Components/MonitorTimeFrameHeader";
import StatusBoxes from "./Components/StatusBoxes";
import GaugeBoxes from "./Components/GaugeBoxes";
import AreaChartBoxes from "./Components/AreaChartBoxes";
import GenericFallback from "../../../Components/GenericFallback";
import NetworkStats from "./Components/NetworkStats";
import CustomTabList from "../../../Components/Tab";
import TabContext from "@mui/lab/TabContext";

// Utils
import { useTheme } from "@emotion/react";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import { useFetchHardwareMonitorById } from "../../../Hooks/monitorHooks";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

// Constants
const BREADCRUMBS = [
	{ name: "infrastructure monitors", path: "/infrastructure" },
	{ name: "details", path: "" },
];
const InfrastructureDetails = () => {

	// Local state
	const [dateRange, setDateRange] = useState("recent");
	const [trigger, setTrigger] = useState(false);
	const [tab, setTab] = useState("details");

	// Utils
	const theme = useTheme();
	const { monitorId } = useParams();
	const { t } = useTranslation();
	const isAdmin = useIsAdmin();

	const [monitor, isLoading, networkError] = useFetchHardwareMonitorById({
		monitorId,
		dateRange,
		updateTrigger: trigger,
	});

	const triggerUpdate = () => {
		setTrigger(!trigger);
	};

	if (networkError === true) {
		return (
			<GenericFallback>
				<Typography
					variant="h1"
					marginY={theme.spacing(4)}
					color={theme.palette.primary.contrastTextTertiary}
				>
					{t("common.toasts.networkError")}
				</Typography>
				<Typography>{t("common.toasts.checkConnection")}</Typography>
			</GenericFallback>
		);
	}

	if (!isLoading && monitor?.stats?.checks?.length === 0) {
		return (
			<Stack gap={theme.spacing(10)}>
				<Breadcrumbs list={BREADCRUMBS} />
				<MonitorDetailsControlHeader
					path={"infrastructure"}
					isLoading={isLoading}
					isAdmin={isAdmin}
					monitor={monitor}
					triggerUpdate={triggerUpdate}
				/>
				<GenericFallback>
					<Typography>{t("distributedUptimeDetailsNoMonitorHistory")}</Typography>
				</GenericFallback>
			</Stack>
		);
	}

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<MonitorDetailsControlHeader
				path={"infrastructure"}
				isLoading={isLoading}
				isAdmin={isAdmin}
				monitor={monitor}
				triggerUpdate={triggerUpdate}
			/>
			<TabContext value={tab}>
				<CustomTabList
					value={tab}
					onChange={(e, v) => setTab(v)}
				>
					<Tab
						label="Details"
						value="details"
					/>
					<Tab
						label="Network"
						value="network"
					/>
				</CustomTabList>
				{tab === "details" && (
					<>
						<StatusBoxes
							shouldRender={!isLoading}
							monitor={monitor}
						/>
						<GaugeBoxes
							isLoading={isLoading}
							monitor={monitor}
						/>
						<MonitorTimeFrameHeader
							isLoading={isLoading}
							dateRange={dateRange}
							setDateRange={setDateRange}
						/>
						<AreaChartBoxes
							shouldRender={!isLoading}
							monitor={monitor}
						/>
					</>
				)}
				{tab === "network" && (
					<NetworkStats
						net={monitor?.stats?.aggregateData?.latestCheck?.net || []}
						isLoading={isLoading}
						checks={monitor?.stats?.checks}
						dateRange={dateRange}
						setDateRange={setDateRange}
					/>
				)}
			</TabContext>
		</Stack>
	);
};

export default InfrastructureDetails;
