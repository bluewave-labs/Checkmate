// Components
import { useState } from "react";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import { Stack, Typography } from "@mui/material";
import CreateMonitorHeader from "../../../Components/MonitorCreateHeader";
import MonitorCountHeader from "../../../Components/MonitorCountHeader";
import MonitorGrid from "./Components/MonitorGrid";
import Fallback from "../../../Components/Fallback";
import GenericFallback from "../../../Components/GenericFallback";
import FallbackPageSpeedWarning from "../../../Components/Fallback/FallbackPageSpeedWarning";

// Utils
import { useTheme } from "@emotion/react";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import { useTranslation } from "react-i18next";
import { useFetchMonitorsByTeamId } from "../../../Hooks/monitorHooks";
import { useFetchSettings } from "../../../Hooks/settingsHooks";
// Constants
const BREADCRUMBS = [{ name: `pagespeed`, path: "/pagespeed" }];
const TYPES = ["pagespeed"];
const PageSpeed = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const isAdmin = useIsAdmin();

	const [monitors, monitorsSummary, isLoading, networkError] = useFetchMonitorsByTeamId({
		limit: 10,
		types: TYPES,
		page: null,
		rowsPerPage: null,
		filter: null,
		field: null,
		order: null,
	});

	const [settingsData, setSettingsData] = useState(undefined);
	const [isSettingsLoading, settingsError] = useFetchSettings({
		setSettingsData,
		setIsApiKeySet: () => {},
		setIsEmailPasswordSet: () => {},
	});

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

	if (!isLoading && monitors?.length === 0) {
		return (
			<Fallback
				type="pageSpeed"
				title={t("pageSpeed.fallback.title")}
				checks={t("pageSpeed.fallback.checks", { returnObjects: true })}
				link="/pagespeed/create"
				isAdmin={isAdmin}
			>
				{isAdmin && settingsData && !settingsData.pagespeedApiKey && (
					<FallbackPageSpeedWarning settingsData={settingsData} />
				)}
			</Fallback>
		);
	}

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<CreateMonitorHeader
				isAdmin={isAdmin}
				isLoading={isLoading}
				path="/pagespeed/create"
			/>
			<MonitorCountHeader
				isLoading={isLoading}
				monitorCount={monitorsSummary?.totalMonitors}
				sx={{ mb: theme.spacing(8) }}
			/>
			<MonitorGrid
				size={6}
				shouldRender={!isLoading}
				monitors={monitors}
			/>
		</Stack>
	);
};

export default PageSpeed;
