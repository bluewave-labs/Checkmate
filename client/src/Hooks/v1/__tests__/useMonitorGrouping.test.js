import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useMonitorGrouping } from "../useMonitorGrouping";
import { mockMonitors } from "../../test/utils";

describe("useMonitorGrouping", () => {
	it("should group monitors correctly", () => {
		const { result } = renderHook(() => useMonitorGrouping(mockMonitors));

		expect(result.current.hasGroups).toBe(true);
		expect(result.current.groupedMonitors.grouped).toHaveProperty("Infrastructure");
		expect(result.current.groupedMonitors.grouped).toHaveProperty("Services");

		// Infrastructure group should have 2 monitors
		expect(result.current.groupedMonitors.grouped.Infrastructure).toHaveLength(2);
		expect(result.current.groupedMonitors.grouped.Infrastructure[0].name).toBe(
			"Database Server"
		);
		expect(result.current.groupedMonitors.grouped.Infrastructure[1].name).toBe(
			"Web Server"
		);

		// Services group should have 1 monitor
		expect(result.current.groupedMonitors.grouped.Services).toHaveLength(1);
		expect(result.current.groupedMonitors.grouped.Services[0].name).toBe("API Endpoint");
	});

	it("should handle ungrouped monitors correctly", () => {
		const { result } = renderHook(() => useMonitorGrouping(mockMonitors));

		// Should have 2 ungrouped monitors (null group and empty string group)
		expect(result.current.groupedMonitors.ungrouped).toHaveLength(2);
		expect(result.current.groupedMonitors.ungrouped[0].name).toBe("Backup System");
		expect(result.current.groupedMonitors.ungrouped[1].name).toBe("Cache Server");
	});

	it("should sort groups alphabetically", () => {
		const { result } = renderHook(() => useMonitorGrouping(mockMonitors));

		const groupNames = Object.keys(result.current.groupedMonitors.grouped);
		expect(groupNames).toEqual(["Infrastructure", "Services"]);
	});

	it("should handle empty monitors array", () => {
		const { result } = renderHook(() => useMonitorGrouping([]));

		expect(result.current.hasGroups).toBe(false);
		expect(result.current.groupedMonitors.grouped).toEqual({});
		expect(result.current.groupedMonitors.ungrouped).toEqual([]);
	});

	it("should handle undefined monitors", () => {
		const { result } = renderHook(() => useMonitorGrouping(undefined));

		expect(result.current.hasGroups).toBe(false);
		expect(result.current.groupedMonitors.grouped).toEqual({});
		expect(result.current.groupedMonitors.ungrouped).toEqual([]);
	});

	it("should handle monitors with only ungrouped items", () => {
		const ungroupedMonitors = [
			{
				_id: "1",
				name: "Monitor 1",
				group: null,
			},
			{
				_id: "2",
				name: "Monitor 2",
				group: "",
			},
			{
				_id: "3",
				name: "Monitor 3",
				// no group property
			},
		];

		const { result } = renderHook(() => useMonitorGrouping(ungroupedMonitors));

		expect(result.current.hasGroups).toBe(false);
		expect(result.current.groupedMonitors.grouped).toEqual({});
		expect(result.current.groupedMonitors.ungrouped).toHaveLength(3);
	});

	it("should handle monitors with only grouped items", () => {
		const groupedMonitors = [
			{
				_id: "1",
				name: "Monitor 1",
				group: "Group A",
			},
			{
				_id: "2",
				name: "Monitor 2",
				group: "Group B",
			},
			{
				_id: "3",
				name: "Monitor 3",
				group: "Group A",
			},
		];

		const { result } = renderHook(() => useMonitorGrouping(groupedMonitors));

		expect(result.current.hasGroups).toBe(true);
		expect(result.current.groupedMonitors.ungrouped).toHaveLength(0);
		expect(result.current.groupedMonitors.grouped).toHaveProperty("Group A");
		expect(result.current.groupedMonitors.grouped).toHaveProperty("Group B");
		expect(result.current.groupedMonitors.grouped["Group A"]).toHaveLength(2);
		expect(result.current.groupedMonitors.grouped["Group B"]).toHaveLength(1);
	});

	it("should handle monitors with nested monitor object", () => {
		const monitorsWithNestedStructure = [
			{
				_id: "1",
				name: "Monitor 1",
				monitor: {
					group: "Nested Group",
				},
			},
			{
				_id: "2",
				name: "Monitor 2",
				group: "Direct Group",
			},
		];

		const { result } = renderHook(() => useMonitorGrouping(monitorsWithNestedStructure));

		expect(result.current.hasGroups).toBe(true);
		expect(result.current.groupedMonitors.grouped).toHaveProperty("Direct Group");
		expect(result.current.groupedMonitors.grouped).toHaveProperty("Nested Group");
	});

	it("should prioritize direct group over nested monitor.group", () => {
		const monitorsWithBothGroupTypes = [
			{
				_id: "1",
				name: "Monitor 1",
				group: "Direct Group",
				monitor: {
					group: "Nested Group",
				},
			},
		];

		const { result } = renderHook(() => useMonitorGrouping(monitorsWithBothGroupTypes));

		expect(result.current.hasGroups).toBe(true);
		expect(result.current.groupedMonitors.grouped).toHaveProperty("Direct Group");
		expect(result.current.groupedMonitors.grouped).not.toHaveProperty("Nested Group");
		expect(result.current.groupedMonitors.grouped["Direct Group"]).toHaveLength(1);
	});

	it("should handle whitespace-only group names", () => {
		const monitorsWithWhitespaceGroups = [
			{
				_id: "1",
				name: "Monitor 1",
				group: "   ",
			},
			{
				_id: "2",
				name: "Monitor 2",
				group: "\\t\\n",
			},
		];

		const { result } = renderHook(() => useMonitorGrouping(monitorsWithWhitespaceGroups));

		expect(result.current.hasGroups).toBe(false);
		expect(result.current.groupedMonitors.ungrouped).toHaveLength(2);
	});

	it("should be case-sensitive for group names", () => {
		const monitorsWithCaseSensitiveGroups = [
			{
				_id: "1",
				name: "Monitor 1",
				group: "infrastructure",
			},
			{
				_id: "2",
				name: "Monitor 2",
				group: "Infrastructure",
			},
		];

		const { result } = renderHook(() =>
			useMonitorGrouping(monitorsWithCaseSensitiveGroups)
		);

		expect(result.current.hasGroups).toBe(true);
		expect(result.current.groupedMonitors.grouped).toHaveProperty("infrastructure");
		expect(result.current.groupedMonitors.grouped).toHaveProperty("Infrastructure");
		expect(Object.keys(result.current.groupedMonitors.grouped)).toHaveLength(2);
	});
});
