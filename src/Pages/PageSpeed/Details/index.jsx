// Components
import { Stack, Typography } from "@mui/material";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import MonitorTimeFrameHeader from "../../../Components/MonitorTimeFrameHeader";
import MonitorStatusHeader from "../../../Components/MonitorStatusHeader";
import PageSpeedStatusBoxes from "./Components/PageSpeedStatusBoxes";
import PageSpeedAreaChart from "./Components/PageSpeedAreaChart";
import PerformanceReport from "./Components/PerformanceReport";
import GenericFallback from "../../../Components/GenericFallback";
// Utils
import { useTheme } from "@emotion/react";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useMonitorFetch } from "./Hooks/useMonitorFetch";
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

	const { monitor, audits, isLoading, networkError } = useMonitorFetch({
		monitorId,
	});

	const [metrics, setMetrics] = useState({
		accessibility: true,
		bestPractices: true,
		performance: true,
		seo: true,
	});

	// Handlers
	const handleMetrics = (id) => {
		setMetrics((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	if (networkError === true) {
		return (
			<GenericFallback>
				<Typography
					variant="h1"
					marginY={theme.spacing(4)}
					color={theme.palette.primary.contrastTextTertiary}
				>
					{t("networkError")}
				</Typography>
				<Typography>{t("checkConnection")}</Typography>
			</GenericFallback>
		);
	}

	// Empty view, displayed when loading is complete and there are no checks
	if (!isLoading && monitor?.checks?.length === 0) {
		return (
			<Stack gap={theme.spacing(10)}>
				<Breadcrumbs list={BREADCRUMBS} />
				<MonitorStatusHeader
					path={"pagespeed"}
					isAdmin={isAdmin}
					monitor={monitor}
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
			<MonitorStatusHeader
				path={"pagespeed"}
				isAdmin={isAdmin}
				shouldRender={!isLoading}
				monitor={monitor}
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
