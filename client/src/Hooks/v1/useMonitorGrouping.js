import { useMemo } from "react";

/**
 * Custom hook to group monitors by their group field
 * @param {Array} monitors - Array of monitor objects
 * @returns {Object} { groupedMonitors, hasGroups }
 */
export const useMonitorGrouping = (monitors = []) => {
	const groupedMonitors = useMemo(() => {
		if (!monitors || monitors.length === 0) {
			return { grouped: {}, ungrouped: [] };
		}

		const grouped = {};
		const ungrouped = [];

		monitors.forEach((monitor) => {
			// Check if monitor has a group (either from the monitor object or monitor.monitor object)
			const group = monitor.group || monitor.monitor?.group;

			if (group && group.trim() !== "") {
				const groupName = group.trim();
				if (!grouped[groupName]) {
					grouped[groupName] = [];
				}
				grouped[groupName].push(monitor);
			} else {
				ungrouped.push(monitor);
			}
		});

		// Sort groups alphabetically and sort monitors within each group
		const sortedGrouped = {};
		Object.keys(grouped)
			.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
			.forEach((groupName) => {
				sortedGrouped[groupName] = grouped[groupName].sort((a, b) => {
					const nameA = a.name || a.url || "";
					const nameB = b.name || b.url || "";
					return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
				});
			});

		// Sort ungrouped monitors
		ungrouped.sort((a, b) => {
			const nameA = a.name || a.url || "";
			const nameB = b.name || b.url || "";
			return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
		});

		return { grouped: sortedGrouped, ungrouped };
	}, [monitors]);

	const hasGroups = Object.keys(groupedMonitors.grouped).length > 0;

	return { groupedMonitors, hasGroups };
};
