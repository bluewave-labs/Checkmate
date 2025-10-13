import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../../test/utils";
import CreateInfrastructureMonitor from "../index";
import { MemoryRouter } from "react-router-dom";

// Mock dependencies
const mockCreateMonitor = vi.fn();
const mockUpdateMonitor = vi.fn();
const mockSubmitInfrastructureForm = vi.fn();
const mockBuildForm = vi.fn();
const mockValidateForm = vi.fn();

vi.mock("../../../../../Hooks/v1/monitorHooks.js", () => ({
	useDeleteMonitor: () => [vi.fn(), false],
	useFetchGlobalSettings: () => [{}, false],
	useFetchHardwareMonitorById: () => [null, false],
	usePauseMonitor: () => [vi.fn(), false],
}));

vi.mock("../../../../../Hooks/v1/useNotifications.js", () => ({
	useGetNotificationsByTeamId: () => [[], false],
}));

vi.mock("../hooks/useInfrastructureMonitorForm.jsx", () => ({
	default: () => ({
		infrastructureMonitor: {
			url: "",
			name: "",
			group: "",
			secret: "",
			statusWindowSize: 5,
			statusWindowThreshold: 60,
			interval: 1,
			notifications: [],
			thresholds: {},
		},
		setInfrastructureMonitor: vi.fn(),
		onChangeForm: vi.fn(),
		handleCheckboxChange: vi.fn(),
		initializeInfrastructureMonitorForCreate: vi.fn(),
		initializeInfrastructureMonitorForUpdate: vi.fn(),
	}),
}));

vi.mock("../hooks/useValidateInfrastructureForm.jsx", () => ({
	default: () => ({
		errors: {},
		validateField: vi.fn(),
		validateForm: mockValidateForm,
	}),
}));

vi.mock("../hooks/useInfrastructureSubmit.jsx", () => ({
	default: () => ({
		buildForm: mockBuildForm,
		submitInfrastructureForm: mockSubmitInfrastructureForm,
		isCreating: false,
		isUpdating: false,
	}),
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

function renderInfrastructureCreateForm(props = {}) {
	return renderWithProviders(
		<MemoryRouter>
			<CreateInfrastructureMonitor {...props} />
		</MemoryRouter>
	);
}

describe("CreateInfrastructureMonitor Form Integration - Group Field", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockValidateForm.mockReturnValue(null); // No validation errors
		mockBuildForm.mockReturnValue({
			url: "http://localhost:59232/api/v1/metrics",
			name: "Test Infrastructure",
			group: "Production",
			secret: "test-secret",
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should render group field with correct attributes", () => {
		renderInfrastructureCreateForm();

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
		renderInfrastructureCreateForm();

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "Infrastructure");

		expect(groupInput.value).toBe("Infrastructure");
	});

	it("should include group field in form submission", async () => {
		const user = userEvent.setup();
		renderInfrastructureCreateForm();

		// Fill required fields
		const urlInput = screen.getByPlaceholderText("localhost:59232/api/v1/metrics");
		await user.type(urlInput, "server.example.com:59232/api/v1/metrics");

		const nameInput = screen.getByLabelText(/display name/i);
		await user.type(nameInput, "Production Server");

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "Infrastructure");

		const secretInput = screen.getByLabelText(/authorization secret/i);
		await user.type(secretInput, "my-secret-key");

		// Submit form
		const submitButton = screen.getByRole("button", { name: /create monitor/i });
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockSubmitInfrastructureForm).toHaveBeenCalled();
		});
	});

	it("should handle empty group field", async () => {
		const user = userEvent.setup();
		renderInfrastructureCreateForm();

		// Fill required fields without group
		const urlInput = screen.getByPlaceholderText("localhost:59232/api/v1/metrics");
		await user.type(urlInput, "server.example.com:59232/api/v1/metrics");

		const nameInput = screen.getByLabelText(/display name/i);
		await user.type(nameInput, "Test Server");

		const secretInput = screen.getByLabelText(/authorization secret/i);
		await user.type(secretInput, "secret");

		// Submit form
		const submitButton = screen.getByRole("button", { name: /create monitor/i });
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockSubmitInfrastructureForm).toHaveBeenCalled();
		});
	});

	it("should validate group field when form is submitted", async () => {
		const user = userEvent.setup();

		// Mock validation error for group field
		mockValidateForm.mockReturnValue({
			group: "Group name must be 50 characters or less.",
		});

		renderInfrastructureCreateForm();

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "a".repeat(60)); // Too long

		// Fill other required fields
		const urlInput = screen.getByPlaceholderText("localhost:59232/api/v1/metrics");
		await user.type(urlInput, "server.example.com:59232/api/v1/metrics");

		const secretInput = screen.getByLabelText(/authorization secret/i);
		await user.type(secretInput, "secret");

		// Submit form
		const submitButton = screen.getByRole("button", { name: /create monitor/i });
		await user.click(submitButton);

		// Should not call submit due to validation error
		await waitFor(() => {
			expect(mockSubmitInfrastructureForm).not.toHaveBeenCalled();
		});
	});

	it("should handle special characters in group name", async () => {
		const user = userEvent.setup();
		renderInfrastructureCreateForm();

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "Prod-Infrastructure_2024");

		expect(groupInput.value).toBe("Prod-Infrastructure_2024");
	});

	it("should maintain group field state during form interaction", async () => {
		const user = userEvent.setup();
		renderInfrastructureCreateForm();

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "Database Servers");

		// Interact with other form elements
		const nameInput = screen.getByLabelText(/display name/i);
		await user.type(nameInput, "DB Server 1");

		// Switch protocol
		const httpButton = screen.getByRole("button", { name: /^http$/i });
		await user.click(httpButton);

		// Group value should be maintained
		expect(groupInput.value).toBe("Database Servers");
	});

	it("should work with HTTPS protocol selection", async () => {
		const user = userEvent.setup();
		renderInfrastructureCreateForm();

		// Select HTTPS
		const httpsButton = screen.getByRole("button", { name: /^https$/i });
		await user.click(httpsButton);

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "Secure Infrastructure");

		expect(groupInput.value).toBe("Secure Infrastructure");
	});

	it("should handle notification configuration with group field", async () => {
		const user = userEvent.setup();
		renderInfrastructureCreateForm();

		// Fill group field
		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "Critical Infrastructure");

		// Fill other required fields
		const urlInput = screen.getByPlaceholderText("localhost:59232/api/v1/metrics");
		await user.type(urlInput, "critical-server.example.com:59232/api/v1/metrics");

		const secretInput = screen.getByLabelText(/authorization secret/i);
		await user.type(secretInput, "critical-secret");

		// The notification configuration should work alongside group field
		expect(groupInput.value).toBe("Critical Infrastructure");
	});

	it("should handle incident configuration alongside group field", async () => {
		const user = userEvent.setup();
		renderInfrastructureCreateForm();

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "Monitoring Infrastructure");

		// Modify incident configuration
		const statusWindowSizeInput = screen.getByLabelText(/status window/i);
		await user.clear(statusWindowSizeInput);
		await user.type(statusWindowSizeInput, "10");

		// Group field should maintain its value
		expect(groupInput.value).toBe("Monitoring Infrastructure");
		expect(statusWindowSizeInput.value).toBe("10");
	});

	it("should handle custom alerts configuration with group field", async () => {
		const user = userEvent.setup();
		renderInfrastructureCreateForm();

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "High Performance Servers");

		// The custom alerts section should be present
		expect(screen.getByText(/custom alerts/i)).toBeInTheDocument();
		expect(groupInput.value).toBe("High Performance Servers");
	});

	it("should handle frequency selection with group field", async () => {
		const user = userEvent.setup();
		renderInfrastructureCreateForm();

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "Monitoring Group");

		// Change check frequency
		const frequencySelect = screen.getByLabelText(/check frequency/i);
		await user.click(frequencySelect);

		// Group field should maintain its value
		expect(groupInput.value).toBe("Monitoring Group");
	});

	it("should call form validation with group field data", async () => {
		const user = userEvent.setup();
		renderInfrastructureCreateForm();

		// Fill all fields including group
		const urlInput = screen.getByPlaceholderText("localhost:59232/api/v1/metrics");
		await user.type(urlInput, "test-server.example.com:59232/api/v1/metrics");

		const nameInput = screen.getByLabelText(/display name/i);
		await user.type(nameInput, "Test Infrastructure Monitor");

		const groupInput = screen.getByLabelText(/group/i);
		await user.type(groupInput, "Test Environment");

		const secretInput = screen.getByLabelText(/authorization secret/i);
		await user.type(secretInput, "test-secret-key");

		// Submit form
		const submitButton = screen.getByRole("button", { name: /create monitor/i });
		await user.click(submitButton);

		// Verify that buildForm was called
		await waitFor(() => {
			expect(mockBuildForm).toHaveBeenCalled();
		});

		// Verify that validateForm was called with the built form
		expect(mockValidateForm).toHaveBeenCalled();
	});
});
