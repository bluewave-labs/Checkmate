// Components
import Breadcrumbs from "../../../Components/Breadcrumbs";
import { Stack, Typography } from "@mui/material";
import CreateMonitorHeader from "../../../Components/MonitorCreateHeader";
import MonitorCountHeader from "../../../Components/MonitorCountHeader";
import MonitorGrid from "./Components/MonitorGrid";
import Fallback from "../../../Components/Fallback";
import GenericFallback from "../../../Components/GenericFallback";

// Utils
import { useTheme } from "@emotion/react";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import { useTranslation } from "react-i18next";
import { useFetchMonitorsByTeamId } from "../../../Hooks/monitorHooks";
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
				title="pagespeed monitor"
				checks={[
					"Report on the user experience of a page",
					"Help analyze webpage speed",
					"Give suggestions on how the page can be improved",
				]}
				link="/pagespeed/create"
				isAdmin={isAdmin}
				// showPageSpeedWarning={isAdmin && !pagespeedApiKey}
			/>
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
