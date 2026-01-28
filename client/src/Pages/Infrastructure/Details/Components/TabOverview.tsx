import { StatusBoxes } from "@/Pages/Infrastructure/Details/Components/StatusBoxes";

import type { Monitor } from "@/Types/Monitor";

export const TabOverview = ({ monitor }: { monitor: Monitor | undefined }) => {
	if (!monitor) {
		return null;
	}
	return <StatusBoxes monitor={monitor} />;
};
