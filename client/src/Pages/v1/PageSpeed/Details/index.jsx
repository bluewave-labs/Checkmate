// Components
import { Stack, Typography } from "@mui/material";
import Breadcrumbs from "../../../../Components/Breadcrumbs/index.jsx";
import MonitorTimeFrameHeader from "../../../../Components/MonitorTimeFrameHeader/index.jsx";
import PageSpeedStatusBoxes from "./Components/PageSpeedStatusBoxes/index.jsx";
import MonitorDetailsControlHeader from "../../../../Components/MonitorDetailsControlHeader/index.jsx";
import PageSpeedAreaChart from "./Components/PageSpeedAreaChart/index.jsx";
import PerformanceReport from "./Components/PerformanceReport/index.jsx";
import GenericFallback from "../../../../Components/GenericFallback/index.jsx";
// Utils
import { useTheme } from "@emotion/react";
import { useIsAdmin } from "../../../../Hooks/v1/useIsAdmin.js";
import { useParams } from "react-router-dom";
import { useFetchStatsByMonitorId } from "../../../../Hooks/v1/monitorHooks.js";
import { useState } from "react";
import { useTranslation } from "react-i18next";
// Constants
const BREADCRUMBS = [
	{ name: "pagespeed", path: "/pagespeed" },
	{ name: "details", path: `` },
	// { name: "details", path: `/pagespeed/${monitorId}` }, // Not needed?
];

const PageSpeedDetails = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const isAdmin = useIsAdmin();
	const { monitorId } = useParams();

	// Local state
	const [metrics, setMetrics] = useState({
		accessibility: true,
		bestPractices: true,
		performance: true,
		seo: true,
	});
	const [trigger, setTrigger] = useState(false);
	// Network
	const [monitor, audits, isLoading, networkError] = useFetchStatsByMonitorId({
		monitorId,
		sortOrder: "desc",
		limit: 50,
		dateRange: "day",
		numToDisplay: null,
		normalize: null,
		updateTrigger: trigger,
	});

	// Handlers
	const handleMetrics = (id) => {
		setMetrics((prev) => ({ ...prev, [id]: !prev[id] }));
	};

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

	// Empty view, displayed when loading is complete and there are no checks
	if (!isLoading && monitor?.checks?.length === 0) {
		return (
			<Stack gap={theme.spacing(10)}>
				<Breadcrumbs list={BREADCRUMBS} />
				<MonitorDetailsControlHeader
					path={"pagespeed"}
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
				path={"pagespeed"}
				isLoading={isLoading}
				isAdmin={isAdmin}
				monitor={monitor}
				triggerUpdate={triggerUpdate}
			/>
			<PageSpeedStatusBoxes
				shouldRender={!isLoading}
				monitor={monitor}
			/>
			<MonitorTimeFrameHeader
				shouldRender={!isLoading}
				dateRange={"day"}
				hasDateRange={false}
			/>

			<PageSpeedAreaChart
				shouldRender={!isLoading}
				monitor={monitor}
				metrics={metrics}
				handleMetrics={handleMetrics}
			/>
			<PerformanceReport
				shouldRender={!isLoading}
				audits={audits}
			/>
		</Stack>
	);
};

export default PageSpeedDetails;
