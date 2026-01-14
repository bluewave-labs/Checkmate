// Components
import { useState } from "react";
import Breadcrumbs from "@/Components/v1/Breadcrumbs/index.jsx";
import { Stack } from "@mui/material";
import CreateMonitorHeader from "@/Components/v1/MonitorCreateHeader/index.jsx";
import MonitorCountHeader from "@/Components/v1/MonitorCountHeader/index.jsx";
import MonitorGrid from "./Components/MonitorGrid/index.jsx";
import PageStateWrapper from "@/Components/v1/PageStateWrapper/index.jsx";
import FallbackPageSpeedWarning from "@/Components/v1/Fallback/FallbackPageSpeedWarning.jsx";

// Utils
import { useTheme } from "@emotion/react";
import { useIsAdmin } from "@/Hooks/useIsAdmin.js";
import { useFetchMonitorsWithChecks } from "@/Hooks/monitorHooks.js";
import { useFetchSettings } from "@/Hooks/settingsHooks.js";
// Constants
const BREADCRUMBS = [{ name: `pagespeed`, path: "/pagespeed" }];
const TYPES = ["pagespeed"];
const PageSpeed = () => {
	const theme = useTheme();
	const isAdmin = useIsAdmin();

	const [
		monitorsWithChecks,
		monitorsWithChecksCount,
		monitorsWithChecksIsLoading,
		monitorsWithChecksNetworkError,
	] = useFetchMonitorsWithChecks({
		types: TYPES,
		limit: 10,
		page: null,
		rowsPerPage: null,
		filter: null,
		field: null,
		order: null,
		monitorUpdateTrigger: null,
	});

	const [settingsData, setSettingsData] = useState(undefined);
	const [isSettingsLoading, settingsError] = useFetchSettings({
		setSettingsData,
		setIsApiKeySet: () => {},
		setIsEmailPasswordSet: () => {},
	});

	return (
		<>
			<PageStateWrapper
				networkError={monitorsWithChecksNetworkError}
				isLoading={monitorsWithChecksIsLoading}
				items={monitorsWithChecks}
				type="pageSpeed"
				fallbackLink="/pagespeed/create"
				fallbackChildren={
					isAdmin &&
					settingsData &&
					!settingsData.pagespeedApiKey && (
						<FallbackPageSpeedWarning settingsData={settingsData} />
					)
				}
			>
				<Stack gap={theme.spacing(10)}>
					<Breadcrumbs list={BREADCRUMBS} />
					<CreateMonitorHeader
						isAdmin={isAdmin}
						isLoading={monitorsWithChecksIsLoading}
						path="/pagespeed/create"
					/>
					<MonitorCountHeader
						isLoading={monitorsWithChecksIsLoading}
						monitorCount={monitorsWithChecksCount}
						sx={{ mb: theme.spacing(8) }}
					/>
					<MonitorGrid
						size={6}
						shouldRender={!monitorsWithChecksIsLoading}
						monitors={monitorsWithChecks}
					/>
				</Stack>
			</PageStateWrapper>
		</>
	);
};

export default PageSpeed;
