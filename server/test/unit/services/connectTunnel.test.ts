import { afterEach, describe, expect, it } from "@jest/globals";
import type { AddressInfo } from "node:net";
import { WebSocketServer } from "ws";
import { ConnectTunnel } from "../../../src/domain/connect/connect.tunnel.ts";
import type { ILogger } from "../../../src/utils/logger/logger.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

const PING_INTERVAL_MS = 30;

const waitFor = async (condition: () => boolean, timeoutMs = 2000) => {
	const deadline = Date.now() + timeoutMs;
	while (!condition()) {
		if (Date.now() > deadline) throw new Error("condition not met in time");
		await new Promise((resolve) => setTimeout(resolve, 5));
	}
};

describe("ConnectTunnel liveness", () => {
	let relay: WebSocketServer | undefined;
	let tunnel: ConnectTunnel | undefined;

	afterEach(async () => {
		tunnel?.stop();
		for (const client of relay?.clients ?? []) client.terminate();
		await new Promise((resolve) => (relay ? relay.close(resolve) : resolve(undefined)));
		relay = undefined;
		tunnel = undefined;
	});

	const startTunnel = async (autoPong: boolean) => {
		relay = new WebSocketServer({ port: 0, host: "127.0.0.1", autoPong });
		await new Promise((resolve) => relay?.once("listening", resolve));
		let connections = 0;
		relay.on("connection", () => {
			connections += 1;
		});
		const { port } = relay.address() as AddressInfo;
		tunnel = new ConnectTunnel("http://127.0.0.1:1", createMockLogger() as unknown as ILogger, PING_INTERVAL_MS);
		tunnel.start({ connectUrl: `ws://127.0.0.1:${port}/`, agentId: "inst-1", token: "cmk_test" });
		return () => connections;
	};

	it("keeps a socket open while the relay answers pings", async () => {
		const connections = await startTunnel(true);
		await waitFor(() => tunnel?.status().connected === true);

		await new Promise((resolve) => setTimeout(resolve, PING_INTERVAL_MS * 5));

		expect(tunnel?.status().connected).toBe(true);
		expect(connections()).toBe(1);
	});

	it("drops a socket that stops answering and reconnects", async () => {
		const connections = await startTunnel(false);
		await waitFor(() => tunnel?.status().connected === true);

		// Nothing closes the socket here, as when the host sleeps through a drop.
		await waitFor(() => connections() >= 2, 3000);

		expect(tunnel?.status().lastError ?? null).toBeNull();
	});
});
