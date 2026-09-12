import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { BasePage } from "@/Components/design-elements/BasePage";
import { LAYOUT } from "@/Utils/Theme/constants";

import { useDashboardData } from "@/Pages/Dashboard/hooks/useDashboardData";
import { MonitorStatusCard } from "@/Pages/Dashboard/components/cards/MonitorStatusCard";
import { MonitorsByTypeCard } from "@/Pages/Dashboard/components/cards/MonitorsByTypeCard";

const Dashboard = () => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));

	const { isLoading, error, summary, monitorsByType } = useDashboardData();

	return (
		<BasePage headerKey="dashboard">
			<Box
				display="grid"
				gridTemplateColumns={isSmall ? "1fr" : "1fr 1fr"}
				gap={theme.spacing(LAYOUT.MD)}
			>
				<MonitorStatusCard
					summary={summary}
					isLoading={isLoading}
					error={error}
				/>
				<MonitorsByTypeCard
					monitorsByType={monitorsByType}
					isLoading={isLoading}
					error={error}
				/>
			</Box>
		</BasePage>
	);
};

export default Dashboard;
