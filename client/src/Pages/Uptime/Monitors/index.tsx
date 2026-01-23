import { MonitorBasePageWithStates } from "@/Components/v2/design-elements";

const UptimeMonitorsPage = () => {
	return (
		<MonitorBasePageWithStates
			loading={false}
			error={false}
			items={[]}
			page="uptime"
			actionLink="/uptime/create"
		>
			Test
		</MonitorBasePageWithStates>
	);
};

export default UptimeMonitorsPage;
