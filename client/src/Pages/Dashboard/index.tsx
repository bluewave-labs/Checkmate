import { useMemo } from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

import { BasePage } from "@/Components/design-elements/BasePage";
import { LAYOUT } from "@/Utils/Theme/constants";
import { useMonitorListController } from "@/Hooks/useMonitorListController";
import { MonitorTypes, type MonitorTypeCount } from "@/Types/Monitor";

import { MonitorStatusCard } from "@/Pages/Dashboard/components/cards/MonitorStatusCard";
import { MonitorsByTypeCard } from "@/Pages/Dashboard/components/cards/MonitorsByTypeCard";

const Dashboard = () => {
	const theme = useTheme();
	const { monitors, summary } = useMonitorListController({
		types: [...MonitorTypes],
		checksLimit: 1,
		refreshInterval: 30000,
		rowsPerPageTable: "monitors",
		rowsPerPageDefault: 100,
	});

	const monitorsByType = useMemo<MonitorTypeCount[]>(() => {
		const countMap = new Map<MonitorTypeCount["type"], number>();
		(monitors ?? []).forEach((m) =>
			countMap.set(m.type, (countMap.get(m.type) ?? 0) + 1)
		);
		return [...countMap.entries()]
			.map(([type, count]) => ({ type, count }))
			.sort((a, b) => b.count - a.count);
	}, [monitors]);

	return (
		<BasePage headerKey="dashboard">
			<Box
				display="grid"
				gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
				gap={theme.spacing(LAYOUT.MD)}
			>
				<MonitorStatusCard summary={summary} />
				<MonitorsByTypeCard monitorsByType={monitorsByType} />
			</Box>
		</BasePage>
	);
};

export default Dashboard;
