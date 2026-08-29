import { BasePage } from "@/Components/design-elements";
import { CardGrid } from "./Components/CardGrid";
import { MonitorsContext, useMonitorsRequest } from "./useDashboardData";
import { useCardSelection } from "./useCardSelection";

/**
 * Answers "is anything wrong, and where" across every monitor type at once —
 * the question no single-type page can answer. Problems first and biggest.
 */
const Dashboard = () => {
	const monitorsRequest = useMonitorsRequest();
	const { cards } = useCardSelection();

	return (
		<MonitorsContext.Provider value={monitorsRequest}>
			<BasePage headerKey="dashboard">
				<CardGrid cards={cards} />
			</BasePage>
		</MonitorsContext.Provider>
	);
};

export default Dashboard;
