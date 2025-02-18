// Components
import { Stack, Typography } from "@mui/material";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import CreateMonitorHeader from "../../../Components/MonitorCreateHeader";
import MonitorTable from "./Components/MonitorTable";
import Fallback from "../../../Components/Fallback";
import GenericFallback from "../../../Components/GenericFallback";

// Utils
import { useTheme } from "@mui/material/styles";
import { useIsAdmin } from "../../../Hooks/useIsAdmin";
import { useSubscribeToMonitors } from "./Hooks/useSubscribeToMonitors";
import SkeletonLayout from "./Components/Skeleton";
// Constants
const BREADCRUMBS = [{ name: `Distributed Uptime`, path: "/distributed-uptime" }];

const DistributedUptimeMonitors = () => {
	// Local state
	// Utils
	const theme = useTheme();
	const isAdmin = useIsAdmin();
	const [isLoading, networkError, monitors, monitorsSummary, filteredMonitors] =
		useSubscribeToMonitors();

	if (isLoading) {
		return <SkeletonLayout />;
	}

	if (networkError) {
		return (
			<GenericFallback>
				<Typography
					variant="h1"
					marginY={theme.spacing(4)}
					color={theme.palette.primary.contrastTextTertiary}
				>
					Network error
				</Typography>
				<Typography>Please check your connection</Typography>
			</GenericFallback>
		);
	}

	if (typeof monitorsSummary === "undefined" || monitorsSummary.totalMonitors === 0) {
		return (
			<Fallback
				vowelStart={false}
				title="distributed uptime monitor"
				checks={[
					"Check if a server is online from multiple locations",
					"Detect outages and performance issues in real time",
					"Reduce false alarms by verifying downtime from different networks",
					"Provide insights on regional availability and latency",
				]}
				link="/distributed-uptime/create"
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
				path="/distributed-uptime/create"
			/>
			<MonitorTable
				isLoading={isLoading}
				monitors={filteredMonitors}
			/>
		</Stack>
	);
};

export default DistributedUptimeMonitors;
