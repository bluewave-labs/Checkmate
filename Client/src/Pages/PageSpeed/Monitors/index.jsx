// Components
import Breadcrumbs from "../../../Components/Breadcrumbs";
import { Stack, Box } from "@mui/material";
import CreateMonitorHeader from "../../../Components/CreateMonitorHeader";
import MonitorCountHeader from "../../../Components/MonitorCountHeader";
import MonitorGrid from "./Components/MonitorGrid";
import Fallback from "../../../Components/Fallback";

// Utils
import { useTheme } from "@emotion/react";
import { useSelector } from "react-redux";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import useMonitorsFetch from "./Hooks/useMonitorsFetch";

// Constants
const BREADCRUMBS = [{ name: `pagespeed`, path: "/pagespeed" }];

const PageSpeed = () => {
	const theme = useTheme();
	const isAdmin = useIsAdmin();
	const { user, authToken } = useSelector((state) => state.auth);

	const { isLoading, monitors, summary } = useMonitorsFetch({
		authToken: authToken,
		teamId: user.teamId,
	});

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
			/>
		);
	}

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<CreateMonitorHeader
				isAdmin={isAdmin}
				shouldRender={!isLoading}
				path="/pagespeed/create"
			/>
			<MonitorCountHeader
				shouldRender={!isLoading}
				monitorCount={summary?.totalMonitors}
				heading="PageSpeed monitors"
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
