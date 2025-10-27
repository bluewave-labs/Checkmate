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
import { useIsAdmin } from "../../../../Hooks/v1/useIsAdmin.js";
import { useFetchMonitorsByTeamId } from "../../../../Hooks/v1/monitorHooks.js";
import { useFetchSettings } from "../../../../Hooks/v1/settingsHooks.js";
// Constants
const BREADCRUMBS = [{ name: `pagespeed`, path: "/pagespeed" }];
const TYPES = ["pagespeed"];
const PageSpeed = () => {
	const theme = useTheme();
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

	return (
		<>
			<PageStateWrapper
				networkError={networkError}
				isLoading={isLoading}
				items={monitors}
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
			</PageStateWrapper>
		</>
	);
};

export default PageSpeed;
