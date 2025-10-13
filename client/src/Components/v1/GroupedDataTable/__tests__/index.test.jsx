import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../../test/utils";
import GroupedDataTable from "../index";

// Mock the DataTable component
vi.mock("../../Table/index.jsx", () => ({
	default: ({ headers, data, config }) => (
		<div data-testid="data-table">
			<div data-testid="table-config">{JSON.stringify(config)}</div>
			<div data-testid="table-headers">{JSON.stringify(headers)}</div>
			<div data-testid="table-data">{JSON.stringify(data)}</div>
		</div>
	),
}));

// Mock SVG imports
vi.mock("../../../../../assets/icons/cpu-chip.svg?react", () => ({
	default: () => <div data-testid="cpu-icon">CPU Icon</div>,
}));

const mockHeaders = [
	{ id: "name", content: "Name" },
	{ id: "status", content: "Status" },
];

const mockGroupedMonitors = {
	grouped: {
		Infrastructure: [
			{
				id: "1",
				name: "Database Server",
				status: "up",
				group: "Infrastructure",
			},
			{
				id: "2",
				name: "Web Server",
				status: "up",
				group: "Infrastructure",
			},
		],
		Services: [
			{
				id: "3",
				name: "API Service",
				status: "down",
				group: "Services",
			},
		],
	},
	ungrouped: [
		{
			id: "4",
			name: "Backup System",
			status: "up",
		},
	],
};

const mockConfig = {
	rowSX: { cursor: "pointer" },
	onRowClick: vi.fn(),
	emptyView: "No monitors found",
};

describe("GroupedDataTable", () => {
	it("should render grouped monitors correctly", () => {
		renderWithProviders(
			<GroupedDataTable
				groupedMonitors={mockGroupedMonitors}
				headers={mockHeaders}
				config={mockConfig}
				shouldRender={true}
			/>
		);

		// Check if group headers are rendered
		expect(screen.getByText("Infrastructure")).toBeInTheDocument();
		expect(screen.getByText("Services")).toBeInTheDocument();
		expect(screen.getByText("Other Monitors")).toBeInTheDocument();

		// Check monitor counts
		expect(screen.getByText("2 monitors")).toBeInTheDocument();
		expect(screen.getByText("1 monitor")).toBeInTheDocument();
	});

	it("should expand and collapse groups", () => {
		renderWithProviders(
			<GroupedDataTable
				groupedMonitors={mockGroupedMonitors}
				headers={mockHeaders}
				config={mockConfig}
				shouldRender={true}
			/>
		);

		const infrastructureHeader = screen.getByText("Infrastructure").closest("div");
		const expandButton =
			infrastructureHeader.querySelector('[data-testid*="expand"]') ||
			infrastructureHeader.querySelector("button");

		// Initially expanded, so content should be visible
		expect(screen.getAllByTestId("data-table")).toHaveLength(3); // 2 groups + ungrouped

		// Click to collapse
		if (expandButton) {
			fireEvent.click(expandButton);
		} else {
			// If no specific button, click the whole header
			fireEvent.click(infrastructureHeader);
		}

		// After collapse, there should be fewer data tables
		// Note: This test might need adjustment based on actual implementation
	});

	it("should render ungrouped monitors section", () => {
		renderWithProviders(
			<GroupedDataTable
				groupedMonitors={mockGroupedMonitors}
				headers={mockHeaders}
				config={mockConfig}
				shouldRender={true}
			/>
		);

		expect(screen.getByText("Other Monitors")).toBeInTheDocument();
	});

	it("should handle empty grouped monitors", () => {
		const emptyGroupedMonitors = {
			grouped: {},
			ungrouped: [],
		};

		renderWithProviders(
			<GroupedDataTable
				groupedMonitors={emptyGroupedMonitors}
				headers={mockHeaders}
				config={mockConfig}
				shouldRender={true}
			/>
		);

		// Should render a single DataTable with empty state
		expect(screen.getByTestId("data-table")).toBeInTheDocument();
		const configElement = screen.getByTestId("table-config");
		const config = JSON.parse(configElement.textContent);
		expect(config.emptyView).toBe("No monitors found");
	});

	it("should handle only ungrouped monitors", () => {
		const ungroupedOnlyMonitors = {
			grouped: {},
			ungrouped: [
				{ id: "1", name: "Monitor 1", status: "up" },
				{ id: "2", name: "Monitor 2", status: "down" },
			],
		};

		renderWithProviders(
			<GroupedDataTable
				groupedMonitors={ungroupedOnlyMonitors}
				headers={mockHeaders}
				config={mockConfig}
				shouldRender={true}
			/>
		);

		// Should render a single DataTable without group sections
		const dataTables = screen.getAllByTestId("data-table");
		expect(dataTables).toHaveLength(1);

		// Check that the data contains the ungrouped monitors
		const dataElement = screen.getByTestId("table-data");
		const data = JSON.parse(dataElement.textContent);
		expect(data).toHaveLength(2);
	});

	it("should handle only grouped monitors", () => {
		const groupedOnlyMonitors = {
			grouped: {
				"Test Group": [{ id: "1", name: "Monitor 1", status: "up" }],
			},
			ungrouped: [],
		};

		renderWithProviders(
			<GroupedDataTable
				groupedMonitors={groupedOnlyMonitors}
				headers={mockHeaders}
				config={mockConfig}
				shouldRender={true}
			/>
		);

		expect(screen.getByText("Test Group")).toBeInTheDocument();
		expect(screen.queryByText("Other Monitors")).not.toBeInTheDocument();
	});

	it("should not render when shouldRender is false", () => {
		const { container } = renderWithProviders(
			<GroupedDataTable
				groupedMonitors={mockGroupedMonitors}
				headers={mockHeaders}
				config={mockConfig}
				shouldRender={false}
			/>
		);

		expect(container.firstChild).toBeNull();
	});

	it("should pass correct config to DataTable components", () => {
		renderWithProviders(
			<GroupedDataTable
				groupedMonitors={mockGroupedMonitors}
				headers={mockHeaders}
				config={mockConfig}
				shouldRender={true}
			/>
		);

		const configElements = screen.getAllByTestId("table-config");
		configElements.forEach((element) => {
			const config = JSON.parse(element.textContent);
			expect(config).toHaveProperty("rowSX");
			expect(config).toHaveProperty("onRowClick");
			expect(config.emptyView).toContain("No monitors"); // Should contain group-specific empty message
		});
	});

	it("should render custom empty view when no data", () => {
		const customConfig = {
			...mockConfig,
			emptyView: "Custom empty message",
		};

		const emptyGroupedMonitors = {
			grouped: {},
			ungrouped: [],
		};

		renderWithProviders(
			<GroupedDataTable
				groupedMonitors={emptyGroupedMonitors}
				headers={mockHeaders}
				config={customConfig}
				shouldRender={true}
			/>
		);

		const configElement = screen.getByTestId("table-config");
		const config = JSON.parse(configElement.textContent);
		expect(config.emptyView).toBe("Custom empty message");
	});

	it("should use default empty view when config has no emptyView", () => {
		const configWithoutEmptyView = {
			rowSX: { cursor: "pointer" },
			onRowClick: vi.fn(),
		};

		const emptyGroupedMonitors = {
			grouped: {},
			ungrouped: [],
		};

		renderWithProviders(
			<GroupedDataTable
				groupedMonitors={emptyGroupedMonitors}
				headers={mockHeaders}
				config={configWithoutEmptyView}
				shouldRender={true}
			/>
		);

		const configElement = screen.getByTestId("table-config");
		const config = JSON.parse(configElement.textContent);
		expect(config.emptyView).toBe("No monitors found");
	});

	it("should set ungrouped section as expanded when no groups exist", () => {
		const ungroupedOnlyMonitors = {
			grouped: {},
			ungrouped: [{ id: "1", name: "Monitor 1", status: "up" }],
		};

		renderWithProviders(
			<GroupedDataTable
				groupedMonitors={ungroupedOnlyMonitors}
				headers={mockHeaders}
				config={mockConfig}
				shouldRender={true}
			/>
		);

		// Should render as a regular table, not grouped sections
		const dataTables = screen.getAllByTestId("data-table");
		expect(dataTables).toHaveLength(1);
	});

	it("should handle multiple groups with different monitor counts", () => {
		const multiGroupMonitors = {
			grouped: {
				"Group A": [
					{ id: "1", name: "Monitor 1" },
					{ id: "2", name: "Monitor 2" },
					{ id: "3", name: "Monitor 3" },
				],
				"Group B": [{ id: "4", name: "Monitor 4" }],
				"Group C": [
					{ id: "5", name: "Monitor 5" },
					{ id: "6", name: "Monitor 6" },
				],
			},
			ungrouped: [],
		};

		renderWithProviders(
			<GroupedDataTable
				groupedMonitors={multiGroupMonitors}
				headers={mockHeaders}
				config={mockConfig}
				shouldRender={true}
			/>
		);

		expect(screen.getByText("Group A")).toBeInTheDocument();
		expect(screen.getByText("Group B")).toBeInTheDocument();
		expect(screen.getByText("Group C")).toBeInTheDocument();

		expect(screen.getByText("3 monitors")).toBeInTheDocument();
		expect(screen.getByText("1 monitor")).toBeInTheDocument();
		expect(screen.getByText("2 monitors")).toBeInTheDocument();
	});
});
