import { describe, expect, it, jest } from "@jest/globals";
import { DockerProvider } from "../../../src/service/infrastructure/network/DockerProvider.ts";
import { testStatusProviderContract } from "../../helpers/statusProviderContract.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import { NETWORK_ERROR } from "../../../src/service/infrastructure/network/utils.ts";
import type { Monitor } from "../../../src/types/index.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		type: "docker",
		url: "my-container",
		...overrides,
	}) as Monitor;

const makeContainer = (overrides?: Record<string, any>) => ({
	Id: "abc123def456abc123def456abc123def456abc123def456abc123def456abcd",
	Names: ["/my-container"],
	State: "running",
	...overrides,
});

const createMockDocker = (containers: any[] = [makeContainer()], inspectResult?: any) => {
	const inspect = jest.fn().mockResolvedValue(inspectResult ?? { State: { Status: "running" } });
	const getContainer = jest.fn().mockReturnValue({ inspect });

	const instance = {
		listContainers: jest.fn().mockResolvedValue(containers),
		getContainer,
	};

	const DockerLib = jest.fn().mockReturnValue(instance) as any;

	return { DockerLib, instance, inspect, getContainer };
};

const createProvider = (opts?: { containers?: any[]; inspectResult?: any }) => {
	const logger = createMockLogger();
	const { DockerLib, instance, inspect, getContainer } = createMockDocker(opts?.containers, opts?.inspectResult);
	const provider = new DockerProvider(logger as any, DockerLib);
	return { provider, logger, docker: instance, inspect, getContainer };
};

// ── Contract ─────────────────────────────────────────────────────────────────

testStatusProviderContract("DockerProvider", {
	create: () => createProvider().provider,
	supportedType: "docker",
	unsupportedType: "http",
	makeMonitor: () => makeMonitor(),
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("DockerProvider", () => {
	// ── Container matching ───────────────────────────────────────────────

	describe("container matching", () => {
		it("matches by exact container name", async () => {
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor({ url: "my-container" }));

			expect(result.status).toBe(true);
			expect(result.code).toBe(200);
		});

		it("matches by exact full ID (64 chars)", async () => {
			const fullId = "abc123def456abc123def456abc123def456abc123def456abc123def456abcd";
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor({ url: fullId }));

			expect(result.status).toBe(true);
		});

		it("matches by partial ID prefix", async () => {
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor({ url: "abc123" }));

			expect(result.status).toBe(true);
		});

		it("strips leading slashes from input", async () => {
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor({ url: "///my-container" }));

			expect(result.status).toBe(true);
		});

		it("matches case-insensitively", async () => {
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor({ url: "MY-CONTAINER" }));

			expect(result.status).toBe(true);
		});

		it("returns 404 when no container matches", async () => {
			const { provider, logger } = createProvider();

			const result = await provider.handle(makeMonitor({ url: "nonexistent" }));

			expect(result.status).toBe(false);
			expect(result.code).toBe(404);
			expect(result.message).toBe("Docker container not found");
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("No container found"),
				})
			);
		});
	});

	// ── Ambiguity detection ──────────────────────────────────────────────

	describe("ambiguity detection", () => {
		it("returns error when input matches both exact name and partial ID", async () => {
			// Container whose name matches the input AND whose ID starts with the input
			const container = makeContainer({
				Id: "my-containerabc123def456abc123def456abc123def456abc123def456abcd",
				Names: ["/my-container"],
			});
			const { provider, logger } = createProvider({ containers: [container] });

			const result = await provider.handle(makeMonitor({ url: "my-container" }));

			expect(result.status).toBe(false);
			expect(result.code).toBe(NETWORK_ERROR);
			expect(result.message).toContain("Ambiguous");
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("Ambiguous"),
				})
			);
		});

		it("reports 'exact ID' in ambiguity message when exact ID and name both match", async () => {
			const fullId = "abc123def456abc123def456abc123def456abc123def456abc123def456abcd";
			const container = makeContainer({
				Id: fullId,
				Names: ["/" + fullId],
			});
			const { provider } = createProvider({ containers: [container] });

			const result = await provider.handle(makeMonitor({ url: fullId }));

			expect(result.message).toContain("Using exact ID");
		});

		it("reports 'exact name' in ambiguity message when name and partial ID match", async () => {
			const container = makeContainer({
				Id: "my-containerabc123def456abc123def456abc123def456abc123def456abcd",
				Names: ["/my-container"],
			});
			const { provider } = createProvider({ containers: [container] });

			const result = await provider.handle(makeMonitor({ url: "my-container" }));

			expect(result.message).toContain("Using exact name");
		});
	});

	// ── Container inspection ─────────────────────────────────────────────

	describe("container inspection", () => {
		it("returns running status for running container", async () => {
			const { provider } = createProvider({ inspectResult: { State: { Status: "running" } } });

			const result = await provider.handle(makeMonitor());

			expect(result.status).toBe(true);
			expect(result.message).toBe("Docker container status fetched successfully");
		});

		it("returns not-running status for stopped container", async () => {
			const { provider } = createProvider({ inspectResult: { State: { Status: "exited" } } });

			const result = await provider.handle(makeMonitor());

			expect(result.status).toBe(false);
		});

		it("returns false status when inspect response has no State", async () => {
			const { provider } = createProvider({ inspectResult: {} });

			const result = await provider.handle(makeMonitor());

			expect(result.status).toBe(false);
		});

		it("returns false status when inspect response has State but no Status", async () => {
			const { provider } = createProvider({ inspectResult: { State: {} } });

			const result = await provider.handle(makeMonitor());

			expect(result.status).toBe(false);
		});

		it("handles inspect error with Docker-specific error", async () => {
			const { provider } = createProvider();
			// Make inspect throw a Docker error
			const dockerErr = Object.assign(new Error("container not found"), {
				statusCode: 404,
				reason: "no such container",
				json: { message: "Container not found" },
			});
			provider["docker"] = {
				listContainers: jest.fn().mockResolvedValue([makeContainer()]),
				getContainer: jest.fn().mockReturnValue({
					inspect: jest.fn().mockRejectedValue(dockerErr),
				}),
			} as any;

			// Need to re-assign; simpler to use the createProvider mock
			const { provider: p2 } = createProvider();
			// Override getContainer to return failing inspect
			p2["docker"].getContainer = jest.fn().mockReturnValue({
				inspect: jest.fn().mockRejectedValue(dockerErr),
			});

			const result = await p2.handle(makeMonitor());

			expect(result.status).toBe(false);
			expect(result.code).toBe(404);
			expect(result.message).toBe("Container not found");
		});

		it("handles inspect error with Docker error using reason fallback", async () => {
			const { provider } = createProvider();
			const dockerErr = Object.assign(new Error("error"), {
				statusCode: 500,
				reason: "internal error",
				json: {},
			});
			provider["docker"].getContainer = jest.fn().mockReturnValue({
				inspect: jest.fn().mockRejectedValue(dockerErr),
			});

			const result = await provider.handle(makeMonitor());

			expect(result.message).toBe("internal error");
		});

		it("handles inspect error with Docker error using Error message fallback", async () => {
			const { provider } = createProvider();
			const dockerErr = Object.assign(new Error("base error"), {
				statusCode: 503,
				reason: undefined,
				json: undefined,
			});
			provider["docker"].getContainer = jest.fn().mockReturnValue({
				inspect: jest.fn().mockRejectedValue(dockerErr),
			});

			const result = await provider.handle(makeMonitor());

			expect(result.message).toBe("base error");
		});

		it("handles inspect error with NETWORK_ERROR when no statusCode", async () => {
			const { provider } = createProvider();
			const dockerErr = Object.assign(new Error("unknown"), {
				statusCode: undefined,
			});
			provider["docker"].getContainer = jest.fn().mockReturnValue({
				inspect: jest.fn().mockRejectedValue(dockerErr),
			});

			const result = await provider.handle(makeMonitor());

			expect(result.code).toBe(NETWORK_ERROR);
		});

		it("handles inspect error with standard Error (not Docker error)", async () => {
			const { provider } = createProvider();
			provider["docker"].getContainer = jest.fn().mockReturnValue({
				inspect: jest.fn().mockRejectedValue(new Error("ECONNREFUSED")),
			});

			const result = await provider.handle(makeMonitor());

			expect(result.status).toBe(false);
			expect(result.message).toBe("ECONNREFUSED");
		});

		it("handles inspect error with non-Error non-Docker thrown value", async () => {
			const { provider } = createProvider();
			provider["docker"].getContainer = jest.fn().mockReturnValue({
				inspect: jest.fn().mockRejectedValue("string error"),
			});

			const result = await provider.handle(makeMonitor());

			expect(result.status).toBe(false);
			expect(result.message).toBe("Failed to fetch Docker container information");
		});
	});

	// ── Outer catch ──────────────────────────────────────────────────────

	describe("outer error handling", () => {
		it("throws AppError when containerInput is missing", async () => {
			const { provider } = createProvider();

			await expect(provider.handle(makeMonitor({ url: "" }))).rejects.toThrow("Container name or ID is required for Docker monitor");
		});

		it("throws AppError when listContainers throws", async () => {
			const { provider } = createProvider();
			provider["docker"].listContainers = jest.fn().mockRejectedValue(new Error("Docker daemon unavailable"));

			await expect(provider.handle(makeMonitor())).rejects.toThrow("Docker daemon unavailable");
		});

		it("throws AppError with default message for non-Error thrown values", async () => {
			const { provider } = createProvider();
			provider["docker"].listContainers = jest.fn().mockRejectedValue(null);

			await expect(provider.handle(makeMonitor())).rejects.toThrow("Error performing Docker request");
		});
	});
});
