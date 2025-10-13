import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useGetGroupsByTeamId } from "../useGroups";

// Mock the network service
const mockNetworkService = {
	getGroupsByTeamId: vi.fn(),
};

// Mock the main.jsx module
vi.mock("../../main.jsx", () => ({
	networkService: mockNetworkService,
}));

// Mock the toast utils
vi.mock("../../Utils/toastUtils.jsx", () => ({
	createToast: vi.fn(),
}));

describe("useGetGroupsByTeamId", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should fetch groups successfully", async () => {
		const mockGroups = [
			{ name: "Infrastructure" },
			{ name: "Services" },
			{ name: "Development" },
		];

		mockNetworkService.getGroupsByTeamId.mockResolvedValueOnce({
			data: {
				data: mockGroups,
			},
		});

		const { result } = renderHook(() => useGetGroupsByTeamId());

		// Initially should be loading
		expect(result.current[1]).toBe(true); // isLoading
		expect(result.current[0]).toEqual([]); // groups
		expect(result.current[2]).toBe(null); // error

		// Wait for the API call to complete
		await waitFor(() => {
			expect(result.current[1]).toBe(false); // isLoading should be false
		});

		expect(result.current[0]).toEqual(mockGroups); // groups should be set
		expect(result.current[2]).toBe(null); // error should still be null
		expect(mockNetworkService.getGroupsByTeamId).toHaveBeenCalledTimes(1);
	});

	it("should handle empty response data", async () => {
		mockNetworkService.getGroupsByTeamId.mockResolvedValueOnce({
			data: {
				data: null,
			},
		});

		const { result } = renderHook(() => useGetGroupsByTeamId());

		await waitFor(() => {
			expect(result.current[1]).toBe(false); // isLoading should be false
		});

		expect(result.current[0]).toEqual([]); // groups should be empty array
		expect(result.current[2]).toBe(null); // error should be null
	});

	it("should handle undefined response data", async () => {
		mockNetworkService.getGroupsByTeamId.mockResolvedValueOnce({
			data: undefined,
		});

		const { result } = renderHook(() => useGetGroupsByTeamId());

		await waitFor(() => {
			expect(result.current[1]).toBe(false); // isLoading should be false
		});

		expect(result.current[0]).toEqual([]); // groups should be empty array
		expect(result.current[2]).toBe(null); // error should be null
	});

	it("should handle network errors", async () => {
		const mockError = new Error("Network error");
		mockNetworkService.getGroupsByTeamId.mockRejectedValueOnce(mockError);

		const { result } = renderHook(() => useGetGroupsByTeamId());

		// Wait for the error to be handled
		await waitFor(() => {
			expect(result.current[1]).toBe(false); // isLoading should be false
		});

		expect(result.current[0]).toEqual([]); // groups should remain empty
		expect(result.current[2]).toBe("Network error"); // error should be set
		expect(mockNetworkService.getGroupsByTeamId).toHaveBeenCalledTimes(1);
	});

	it("should handle API errors with custom message", async () => {
		const mockError = new Error("Failed to fetch groups");
		mockNetworkService.getGroupsByTeamId.mockRejectedValueOnce(mockError);

		const { result } = renderHook(() => useGetGroupsByTeamId());

		await waitFor(() => {
			expect(result.current[1]).toBe(false); // isLoading should be false
		});

		expect(result.current[0]).toEqual([]); // groups should remain empty
		expect(result.current[2]).toBe("Failed to fetch groups"); // error should be set
	});

	it("should reset error state on new fetch attempt", async () => {
		const mockError = new Error("Network error");
		mockNetworkService.getGroupsByTeamId.mockRejectedValueOnce(mockError);

		const { result, rerender } = renderHook(() => useGetGroupsByTeamId());

		// Wait for the error to be handled
		await waitFor(() => {
			expect(result.current[2]).toBe("Network error");
		});

		// Mock successful response for retry
		const mockGroups = [{ name: "Infrastructure" }];
		mockNetworkService.getGroupsByTeamId.mockResolvedValueOnce({
			data: {
				data: mockGroups,
			},
		});

		// Trigger re-render (simulating component re-mount or dependency change)
		rerender();

		await waitFor(() => {
			expect(result.current[1]).toBe(false); // isLoading should be false
		});

		expect(result.current[0]).toEqual(mockGroups); // groups should be set
		expect(result.current[2]).toBe(null); // error should be reset
	});

	it("should set loading state correctly during fetch", async () => {
		let resolvePromise;
		const promise = new Promise((resolve) => {
			resolvePromise = resolve;
		});

		mockNetworkService.getGroupsByTeamId.mockReturnValueOnce(promise);

		const { result } = renderHook(() => useGetGroupsByTeamId());

		// Should be loading initially
		expect(result.current[1]).toBe(true);
		expect(result.current[0]).toEqual([]);
		expect(result.current[2]).toBe(null);

		// Resolve the promise
		resolvePromise({
			data: {
				data: [{ name: "Test Group" }],
			},
		});

		await waitFor(() => {
			expect(result.current[1]).toBe(false);
		});

		expect(result.current[0]).toEqual([{ name: "Test Group" }]);
	});

	it("should handle response with no data property", async () => {
		mockNetworkService.getGroupsByTeamId.mockResolvedValueOnce({
			data: null,
		});

		const { result } = renderHook(() => useGetGroupsByTeamId());

		await waitFor(() => {
			expect(result.current[1]).toBe(false);
		});

		expect(result.current[0]).toEqual([]);
		expect(result.current[2]).toBe(null);
	});

	it("should handle malformed response structure", async () => {
		mockNetworkService.getGroupsByTeamId.mockResolvedValueOnce({
			// Missing data property
		});

		const { result } = renderHook(() => useGetGroupsByTeamId());

		await waitFor(() => {
			expect(result.current[1]).toBe(false);
		});

		expect(result.current[0]).toEqual([]);
		expect(result.current[2]).toBe(null);
	});
});
