import { arrayMove } from "@dnd-kit/sortable";
import { dashboardCardKeys, type DashboardCardKey } from "@/Types/Dashboard";

const isDashboardCardKey = (value: unknown): value is DashboardCardKey =>
	typeof value === "string" && (dashboardCardKeys as readonly string[]).includes(value);

export const normalizeCardOrder = (order: unknown): DashboardCardKey[] => {
	const known = Array.isArray(order)
		? [...new Set(order.filter(isDashboardCardKey))]
		: [];
	const missing = dashboardCardKeys.filter((key) => !known.includes(key));
	return [...known, ...missing];
};

export const moveVisibleCard = (
	order: DashboardCardKey[],
	hidden: ReadonlySet<DashboardCardKey>,
	activeKey: DashboardCardKey,
	overKey: DashboardCardKey
): DashboardCardKey[] => {
	const visible = order.filter((key) => !hidden.has(key));
	const from = visible.indexOf(activeKey);
	const to = visible.indexOf(overKey);
	if (from === -1 || to === -1 || from === to) return order;
	const moved = arrayMove(visible, from, to);
	let next = 0;
	return order.map((key) => (hidden.has(key) ? key : moved[next++]));
};
