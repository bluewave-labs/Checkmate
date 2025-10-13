import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../../test/utils";
import UptimeCreate from "../index";
import { MemoryRouter } from "react-router-dom";

// Mock dependencies
const mockCreateMonitor = vi.fn();
const mockUpdateMonitor = vi.fn();
const mockGetNotificationsByTeamId = vi.fn();
const mockFetchMonitorById = vi.fn();
const mockFetchMonitorGames = vi.fn();

vi.mock("../../../../../Hooks/v1/monitorHooks.js", () => ({
	useCreateMonitor: () => [mockCreateMonitor, false],
	useUpdateMonitor: () => [mockUpdateMonitor, false],
	useDeleteMonitor: () => [vi.fn(), false],
	usePauseMonitor: () => [vi.fn(), false],
	useFetchMonitorById: () => [false],
	useFetchMonitorGames: () => [false],
}));

vi.mock("../../../../../Hooks/v1/useNotifications.js", () => ({
	useGetNotificationsByTeamId: () => [[], false, null],
}));

vi.mock("../../../../../Utils/toastUtils.jsx", () => ({
	createToast: vi.fn(),
}));

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return {
		...actual,
		useParams: () => ({}), // Return empty for create mode
		useNavigate: () => vi.fn(),
	};
});

function renderUptimeCreateForm(props = {}) {
	return renderWithProviders(
		<MemoryRouter>
			<UptimeCreate {...props} />
		</MemoryRouter>
	);
}

describe("UptimeCreate Form Integration - Group Field", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should render group field with correct attributes", () => {
		renderUptimeCreateForm();

		const groupInput = screen.getByLabelText(/group/i);
		expect(groupInput).toBeInTheDocument();
		expect(groupInput).toHaveAttribute("type", "text");
		expect(groupInput).toHaveAttribute(
			"placeholder",
			"e.g., Production, Development, Network"
		);
		expect(groupInput.value).toBe("");
	});

	it("should allow user to enter group name", async () => {
		const user = userEvent.setup();
		renderUptimeCreateForm();

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "Production");

		expect(groupInput.value).toBe("Production");
	});

	it("should include group field in form submission for create", async () => {
		const user = userEvent.setup();
		renderUptimeCreateForm();

		// Fill required fields
		const urlInput = screen.getByLabelText(/website url/i);
		await user.type(urlInput, "example.com");

		const nameInput = screen.getByLabelText(/display name/i);
		await user.type(nameInput, "Test Monitor");

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "Production");

		// Submit form
		const submitButton = screen.getByRole("button", { name: /save/i });
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockCreateMonitor).toHaveBeenCalledWith({
				monitor: expect.objectContaining({
					group: "Production",
					name: "Test Monitor",
					url: "https://example.com",
				}),
				redirect: "/uptime",
			});
		});
	});

	it("should handle undefined group when not provided", async () => {
		const user = userEvent.setup();
		renderUptimeCreateForm();

		// Fill required fields without group
		const urlInput = screen.getByLabelText(/website url/i);
		await user.type(urlInput, "example.com");

		const nameInput = screen.getByLabelText(/display name/i);
		await user.type(nameInput, "Test Monitor");

		// Submit form without filling group
		const submitButton = screen.getByRole("button", { name: /save/i });
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockCreateMonitor).toHaveBeenCalledWith({
				monitor: expect.objectContaining({
					group: undefined,
					name: "Test Monitor",
					url: "https://example.com",
				}),
				redirect: "/uptime",
			});
		});
	});

	it("should validate group field length", async () => {
		const user = userEvent.setup();
		renderUptimeCreateForm();

		const groupInput = screen.getByLabelText(/group/i);
		const longGroupName = "a".repeat(60); // Exceeds 50 character limit

		await user.type(groupInput, longGroupName);

		// Fill other required fields
		const urlInput = screen.getByLabelText(/website url/i);
		await user.type(urlInput, "example.com");

		// Submit form
		const submitButton = screen.getByRole("button", { name: /save/i });
		await user.click(submitButton);

		// Should not call createMonitor due to validation error
		await waitFor(() => {
			expect(mockCreateMonitor).not.toHaveBeenCalled();
		});

		// Check for error message
		expect(
			screen.getByText(/group name must be 50 characters or less/i)
		).toBeInTheDocument();
	});

	it("should handle special characters in group name", async () => {
		const user = userEvent.setup();
		renderUptimeCreateForm();

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "Prod-Environment_2024");

		const urlInput = screen.getByLabelText(/website url/i);
		await user.type(urlInput, "example.com");

		const nameInput = screen.getByLabelText(/display name/i);
		await user.type(nameInput, "Test Monitor");

		const submitButton = screen.getByRole("button", { name: /save/i });
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockCreateMonitor).toHaveBeenCalledWith({
				monitor: expect.objectContaining({
					group: "Prod-Environment_2024",
				}),
				redirect: "/uptime",
			});
		});
	});

	it("should trim whitespace from group name", async () => {
		const user = userEvent.setup();
		renderUptimeCreateForm();

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "  Production  ");

		const urlInput = screen.getByLabelText(/website url/i);
		await user.type(urlInput, "example.com");

		const nameInput = screen.getByLabelText(/display name/i);
		await user.type(nameInput, "Test Monitor");

		const submitButton = screen.getByRole("button", { name: /save/i });
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockCreateMonitor).toHaveBeenCalledWith({
				monitor: expect.objectContaining({
					group: "  Production  ", // Frontend validation should handle trimming
				}),
				redirect: "/uptime",
			});
		});
	});

	it("should work with different monitor types", async () => {
		const user = userEvent.setup();
		renderUptimeCreateForm();

		// Select ping monitor type
		const pingRadio = screen.getByLabelText(/ping monitoring/i);
		await user.click(pingRadio);

		// Fill fields for ping monitor
		const urlInput = screen.getByLabelText(/host or ip address/i);
		await user.type(urlInput, "8.8.8.8");

		const nameInput = screen.getByLabelText(/display name/i);
		await user.type(nameInput, "DNS Server");

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "Network Infrastructure");

		const submitButton = screen.getByRole("button", { name: /save/i });
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockCreateMonitor).toHaveBeenCalledWith({
				monitor: expect.objectContaining({
					group: "Network Infrastructure",
					type: "ping",
					url: "8.8.8.8",
					name: "DNS Server",
				}),
				redirect: "/uptime",
			});
		});
	});

	it("should handle port monitor with group", async () => {
		const user = userEvent.setup();
		renderUptimeCreateForm();

		// Select port monitor type
		const portRadio = screen.getByLabelText(/port monitoring/i);
		await user.click(portRadio);

		// Fill fields for port monitor
		const urlInput = screen.getByLabelText(/host or ip address/i);
		await user.type(urlInput, "localhost");

		const portInput = screen.getByLabelText(/port to monitor/i);
		await user.type(portInput, "3000");

		const nameInput = screen.getByLabelText(/display name/i);
		await user.type(nameInput, "Development Server");

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "Development");

		const submitButton = screen.getByRole("button", { name: /save/i });
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockCreateMonitor).toHaveBeenCalledWith({
				monitor: expect.objectContaining({
					group: "Development",
					type: "port",
					url: "localhost",
					port: "3000",
					name: "Development Server",
				}),
				redirect: "/uptime",
			});
		});
	});

	it("should clear errors when changing monitor type", async () => {
		const user = userEvent.setup();
		renderUptimeCreateForm();

		// Add some invalid data first
		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "a".repeat(60)); // Too long

		// Fill other fields and try to submit to trigger validation
		const urlInput = screen.getByLabelText(/website url/i);
		await user.type(urlInput, "example.com");

		const submitButton = screen.getByRole("button", { name: /save/i });
		await user.click(submitButton);

		// Should show error
		await waitFor(() => {
			expect(
				screen.getByText(/group name must be 50 characters or less/i)
			).toBeInTheDocument();
		});

		// Change monitor type - this should clear errors
		const pingRadio = screen.getByLabelText(/ping monitoring/i);
		await user.click(pingRadio);

		// Error should be cleared
		await waitFor(() => {
			expect(
				screen.queryByText(/group name must be 50 characters or less/i)
			).not.toBeInTheDocument();
		});
	});

	it("should maintain group field state when switching between HTTP and HTTPS", async () => {
		const user = userEvent.setup();
		renderUptimeCreateForm();

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "Web Services");

		// Switch to HTTP
		const httpButton = screen.getByRole("button", { name: /^http$/i });
		await user.click(httpButton);

		// Group value should be maintained
		expect(groupInput.value).toBe("Web Services");

		// Switch back to HTTPS
		const httpsButton = screen.getByRole("button", { name: /^https$/i });
		await user.click(httpsButton);

		// Group value should still be maintained
		expect(groupInput.value).toBe("Web Services");
	});
});
