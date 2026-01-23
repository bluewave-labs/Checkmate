import { useGet } from "@/Hooks/UseApi";
import { MonitorBasePageWithStates } from "@/Components/v2/design-elements";
import { type Monitor } from "@/Types/Monitor";
import { FilterControls } from "@/Components/v2/monitors";

const UptimeMonitorsPage = () => {
	const {
		data: monitors,
		isLoading,
		error,
	} = useGet<Monitor[]>("/monitors/team?type=http&type=ping&type=port&type=docker");

	return (
		<MonitorBasePageWithStates
			loading={isLoading}
			error={error}
			items={monitors || []}
			page="uptime"
			actionLink="/uptime/create"
		>
			<FilterControls />
			<pre>{JSON.stringify(monitors, null, 2)}</pre>
		</MonitorBasePageWithStates>
	);
};

export default UptimeMonitorsPage;
