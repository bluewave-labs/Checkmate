import { describe, expect, it, jest } from "@jest/globals";
import { GameProvider } from "../../../../src/service/infrastructure/network/GameProvider.ts";
import { testStatusProviderContract } from "../../../helpers/statusProviderContract.ts";
import { createMockLogger } from "../../../helpers/createMockLogger.ts";
import { NETWORK_ERROR } from "../../../../src/service/infrastructure/network/utils.ts";
import type { Monitor } from "../../../../src/types/index.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		type: "game",
		url: "play.example.com",
		port: 25565,
		gameId: "minecraft",
		...overrides,
	}) as Monitor;

const createMockGameDig = (state?: Record<string, any> | null) => ({
	query: jest.fn().mockResolvedValue(
		state ?? {
			name: "My Server",
			map: "world",
			players: [],
			ping: 45,
		}
	),
});

const createProvider = (gameDig?: any) => {
	const logger = createMockLogger();
	const dig = gameDig ?? createMockGameDig();
	const provider = new GameProvider(logger as any, dig as any);
	return { provider, logger, gameDig: dig };
};

// ── Contract ─────────────────────────────────────────────────────────────────

testStatusProviderContract("GameProvider", {
	create: () => createProvider().provider,
	supportedType: "game",
	unsupportedType: "http",
	makeMonitor: () => makeMonitor(),
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GameProvider", () => {
	it("returns success with server state", async () => {
		const { provider } = createProvider();

		const result = await provider.handle(makeMonitor());

		expect(result).toEqual(
			expect.objectContaining({
				monitorId: "mon-1",
				teamId: "team-1",
				type: "game",
				status: true,
				code: 200,
				message: "Success",
				responseTime: 45,
			})
		);
	});

	it("queries with correct host, port, and gameId", async () => {
		const { provider, gameDig } = createProvider();

		await provider.handle(makeMonitor({ url: "https://play.example.com/path", port: 27015, gameId: "csgo" }));

		expect(gameDig.query).toHaveBeenCalledWith({
			type: "csgo",
			host: "play.example.com",
			port: 27015,
		});
	});

	it("strips protocol and path from url for host", async () => {
		const { provider, gameDig } = createProvider();

		await provider.handle(makeMonitor({ url: "http://game.server.com:8080/info" }));

		expect(gameDig.query).toHaveBeenCalledWith(expect.objectContaining({ host: "game.server.com" }));
	});

	it("defaults gameId to 'unknown' when not set", async () => {
		const { provider, gameDig } = createProvider();

		await provider.handle(makeMonitor({ gameId: undefined }));

		expect(gameDig.query).toHaveBeenCalledWith(expect.objectContaining({ type: "unknown" }));
	});

	it("defaults port to 0 when not set", async () => {
		const { provider, gameDig } = createProvider();

		await provider.handle(makeMonitor({ port: undefined }));

		expect(gameDig.query).toHaveBeenCalledWith(expect.objectContaining({ port: 0 }));
	});

	it("defaults responseTime to 0 when ping is undefined", async () => {
		const { provider } = createProvider(createMockGameDig({ ping: undefined }));

		const result = await provider.handle(makeMonitor());

		expect(result.responseTime).toBe(0);
	});

	it("returns failure when query resolves to undefined (caught error)", async () => {
		const gameDig = { query: jest.fn().mockRejectedValue(new Error("Server offline")) };
		// GameProvider catches the error internally via .catch()
		const { provider, logger } = createProvider(gameDig);

		const result = await provider.handle(makeMonitor());

		expect(result).toEqual(
			expect.objectContaining({
				status: false,
				code: NETWORK_ERROR,
				message: "No response from game server",
				responseTime: 0,
			})
		);
		expect(logger.warn).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "Server offline",
				method: "handle",
			})
		);
	});

	it("logs non-Error thrown values from query", async () => {
		const gameDig = { query: jest.fn().mockRejectedValue("string error") };
		const { provider, logger } = createProvider(gameDig);

		await provider.handle(makeMonitor());

		expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "string error" }));
	});

	it("uses empty string as host when url is undefined", async () => {
		const { provider, gameDig } = createProvider();

		await provider.handle(makeMonitor({ url: undefined }));

		expect(gameDig.query).toHaveBeenCalledWith(expect.objectContaining({ host: "" }));
	});

	it("throws AppError with default message when error stringifies to empty", async () => {
		const gameDig = {
			query: jest.fn().mockReturnValue({
				catch: () => {
					throw new Error("");
				},
			}),
		};
		const { provider } = createProvider(gameDig);

		await expect(provider.handle(makeMonitor())).rejects.toThrow("Error performing game server check");
	});

	it("throws AppError with default message for non-Error that stringifies to empty", async () => {
		const gameDig = {
			query: jest.fn().mockReturnValue({
				catch: () => {
					throw "";
				},
			}),
		};
		const { provider } = createProvider(gameDig);

		await expect(provider.handle(makeMonitor())).rejects.toThrow("Error performing game server check");
	});

	it("throws AppError with Error message in outer catch", async () => {
		const gameDig = {
			query: jest.fn().mockReturnValue({
				catch: () => {
					throw new Error("unexpected");
				},
			}),
		};
		const { provider } = createProvider(gameDig);

		await expect(provider.handle(makeMonitor())).rejects.toThrow("unexpected");
	});
});
