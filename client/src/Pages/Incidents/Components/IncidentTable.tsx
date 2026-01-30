import { Table } from "@/Components/v2/design-elements";
import type { Header } from "@/Components/v2/design-elements";
import type { Incident } from "@/Types/Incident";
import type { Monitor } from "@/Types/Monitor";

interface IncidentsTableProps {
	incidents?: Incident[];
	monitors?: Monitor[];
}
export const IncidentsTable = ({ incidents, monitors }: IncidentsTableProps) => {
	if (!incidents || !monitors) {
		return null;
	}

	// Headers: Monitor name, status, start time, end time, resolution type, status code, message, actions
	return "Table here";
};
