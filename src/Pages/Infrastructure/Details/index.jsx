// Components
import { Stack, Typography } from "@mui/material";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import MonitorStatusHeader from "../../../Components/MonitorStatusHeader";
import MonitorTimeFrameHeader from "../../../Components/MonitorTimeFrameHeader";
import StatusBoxes from "./Components/StatusBoxes";
import GaugeBoxes from "./Components/GaugeBoxes";
import AreaChartBoxes from "./Components/AreaChartBoxes";
import GenericFallback from "../../../Components/GenericFallback";

// Utils
import { useTheme } from "@emotion/react";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import { useHardwareMonitorsFetch } from "./Hooks/useHardwareMonitorsFetch";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

// Constants
const BREADCRUMBS = [
	{ name: "infrastructure monitors", path: "/infrastructure" },
	{ name: "details", path: "" },
];
const InfrastructureDetails = () => {
	// Redux state

	// Local state
	const [dateRange, setDateRange] = useState("recent");

	// Utils
	const theme = useTheme();
	const { monitorId } = useParams();
	const { t } = useTranslation();
	const isAdmin = useIsAdmin();

	const { isLoading, networkError, monitor } = useHardwareMonitorsFetch({
		monitorId,
		dateRange,
	});

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

	if (!isLoading && monitor?.stats?.checks?.length === 0) {
		return (
			<Stack gap={theme.spacing(10)}>
				<Breadcrumbs list={BREADCRUMBS} />
				<MonitorStatusHeader
					path={"infrastructure"}
					isAdmin={false}
					shouldRender={!isLoading}
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
				path={"infrastructure"}
				isAdmin={isAdmin}
				shouldRender={!isLoading}
				monitor={monitor}
			/>
			<StatusBoxes
				shouldRender={!isLoading}
				monitor={monitor}
			/>
			<GaugeBoxes
				shouldRender={!isLoading}
				monitor={monitor}
			/>
			<MonitorTimeFrameHeader
				shouldRender={!isLoading}
				dateRange={dateRange}
				setDateRange={setDateRange}
			/>
			<AreaChartBoxes
				shouldRender={!isLoading}
				monitor={monitor}
			/>
		</Stack>
	);
};

export default InfrastructureDetails;
