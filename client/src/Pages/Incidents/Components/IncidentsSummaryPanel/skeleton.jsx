import { Skeleton } from "@mui/material";
import SummaryCard from "../SummaryCard/index.jsx";

/**
 * Simple skeleton loader for summary panels
 * Reusable for ActiveIncidentsPanel, LatestIncidentsPanel, and StatisticsPanel
 */
const PanelSkeleton = () => {
	return (
		<SummaryCard sx={{ minHeight: "25vh" }}>
			<Skeleton
				variant="rounded"
				width="100%"
				height="100%"
			/>
		</SummaryCard>
	);
};

export default PanelSkeleton;
