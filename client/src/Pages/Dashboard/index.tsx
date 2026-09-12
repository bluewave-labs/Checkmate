import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { BasePage } from "@/Components/design-elements/BasePage";
import { LAYOUT } from "@/Utils/Theme/constants";

import { MonitorStatusCard } from "@/Pages/Dashboard/components/cards/MonitorStatusCard";
import { MonitorsByTypeCard } from "@/Pages/Dashboard/components/cards/MonitorsByTypeCard";
import type { MonitorsSummary } from "@/Types/Monitor";
import type { DashboardTypeCount } from "@/Pages/Dashboard/types";

const MOCK_SUMMARY: MonitorsSummary = {
	totalMonitors: 12,
	upMonitors: 10,
	downMonitors: 1,
	pausedMonitors: 1,
	initializingMonitors: 0,
	maintenanceMonitors: 0,
	breachedMonitors: 0,
};

const MOCK_MONITORS_BY_TYPE: DashboardTypeCount[] = [
	{ type: "http", count: 7 },
	{ type: "ping", count: 3 },
	{ type: "port", count: 2 },
];

const Dashboard = () => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));

	return (
		<BasePage headerKey="dashboard">
			<Box
				display="grid"
				gridTemplateColumns={isSmall ? "1fr" : "1fr 1fr"}
				gap={theme.spacing(LAYOUT.MD)}
			>
				<MonitorStatusCard summary={MOCK_SUMMARY} />
				<MonitorsByTypeCard monitorsByType={MOCK_MONITORS_BY_TYPE} />
			</Box>
		</BasePage>
	);
};

export default Dashboard;
