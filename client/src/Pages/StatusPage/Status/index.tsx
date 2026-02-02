import { BasePage } from "@/Components/v2/design-elements";
import { StatusBar } from "@/Pages/StatusPage/Status/Components/StatusBar";
import Typography from "@mui/material/Typography";

import { useTranslation } from "react-i18next";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { useLocation, useParams } from "react-router-dom";
import { useGet } from "@/Hooks/UseApi";
import type { StatusPageResponse } from "@/Types/StatusPage";
import { HeaderStatusPageControls } from "./Components/HeaderStatusPageControls";

const StatusPageView = () => {
	const { t } = useTranslation();
	const { url } = useParams();
	const isAdmin = useIsAdmin();
	const location = useLocation();
	const isPublic = location.pathname.startsWith("/status/uptime/public");

	const apiUrl = url ? `/status-page/${url}?type=uptime` : null;

	const { data, isLoading, error } = useGet<StatusPageResponse>(apiUrl);

	const statusPage = data?.statusPage;
	const monitors = data?.monitors ?? [];

	if (!statusPage || !monitors) {
		return null;
	}

	if (monitors.length === 0) {
		return "poo";
	}

	return (
		<BasePage
			loading={isLoading}
			error={error}
		>
			<HeaderStatusPageControls
				isAdmin={isAdmin}
				statusPage={statusPage}
				isPublic={isPublic}
			/>
			<Typography variant="h2">{t("statusPageStatusServiceStatus")}</Typography>
			<StatusBar monitors={monitors} />
			<pre> {JSON.stringify(data, null, 2)}</pre>
		</BasePage>
	);
};

export default StatusPageView;
