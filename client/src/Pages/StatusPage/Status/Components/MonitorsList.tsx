import type { Monitor } from "@/Types/Monitor";
import type { StatusPage } from "@/Types/StatusPage";

interface MontorsListProps {
	stautsPage: StatusPage;
	monitors: Monitor[];
}

export const MonitorsList = ({ stautsPage, monitors }: MontorsListProps) => {
	return <div>Monitors List</div>;
};
