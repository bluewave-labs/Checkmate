import { describe, expect, it, jest } from "@jest/globals";
import https from "node:https";
import { DockerProvider } from "../../../../src/service/network/DockerProvider.ts";
import type { IEncryptionService } from "../../../../src/service/encryption/encryptionService.ts";
import { testStatusProviderContract } from "../../../helpers/statusProviderContract.ts";
import { createMockLogger } from "../../../helpers/createMockLogger.ts";
import { NETWORK_ERROR } from "../../../../src/types/network.ts";
import { AppError } from "../../../../src/utils/AppError.ts";
import type { Monitor } from "../../../../src/domain/monitors/monitor.type.ts";
import { DOCKER_LOG_TAIL_LINES } from "../../../../src/domain/docker/docker.type.ts";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const CA_PEM = "-----BEGIN CERTIFICATE-----\nca-one\n-----END CERTIFICATE-----";
const CA_BUNDLE_PEM = `${CA_PEM}\n-----BEGIN CERTIFICATE-----\nca-two\n-----END CERTIFICATE-----\n`;
const CERT_PEM = "-----BEGIN CERTIFICATE-----\nclient\n-----END CERTIFICATE-----";
const KEY_PEM = "-----BEGIN PRIVATE KEY-----\nstub\n-----END PRIVATE KEY-----";
const KEY_CIPHERTEXT = "v1.abc123.iv.tag.data";

const makeEncryptionService = (overrides?: Partial<IEncryptionService>): IEncryptionService => ({
	isConfigured: jest.fn(() => true),
	currentKeyId: jest.fn(() => "abc123"),
	keyIdOf: jest.fn(() => "abc123"),
	needsReencryption: jest.fn(() => false),
	encrypt: jest.fn(() => KEY_CIPHERTEXT),
	decrypt: jest.fn(() => KEY_PEM),
	...overrides,
});

const TIMEOUT_MS = 10000;
const TIMEOUTS = { timeout: TIMEOUT_MS, connectionTimeout: TIMEOUT_MS };

const makeTlsMonitor = (overrides?: Partial<Monitor>): Monitor =>
	makeMonitor({ url: "tcp://host", dockerTlsCa: CA_PEM, dockerTlsCert: CERT_PEM, dockerTlsKeySet: true, ...overrides });

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		type: "docker",
		url: "unix:///var/run/docker.sock",
		...overrides,
	}) as Monitor;

const makeContainer = (overrides?: Record<string, any>) => ({
	Id: "abc123def456abc123def456abc123def456abc123def456abc123def456abcd",
	Names: ["/my-container"],
	Image: "nginx:latest",
	State: "running",
	Status: "Up 3 hours (healthy)",
	...overrides,
});

const makeInspect = (overrides?: Record<string, any>) => ({
	RestartCount: 2,
	State: { StartedAt: "2026-08-28T10:00:00.000Z", Health: { Status: "healthy" } },
	...overrides,
});

// cpuDelta 200M over systemDelta 1000M on 4 cpus → 80%; memory 300MiB raw - 100MiB page cache = 200MiB of 1GiB → 19.53125%
const makeStats = (overrides?: Record<string, any>) => ({
	cpu_stats: {
		cpu_usage: { total_usage: 400_000_000 },
		system_cpu_usage: 2_000_000_000,
		online_cpus: 4,
	},
	precpu_stats: {
		cpu_usage: { total_usage: 200_000_000 },
		system_cpu_usage: 1_000_000_000,
	},
	memory_stats: {
		usage: 300 * 1024 * 1024,
		limit: 1024 * 1024 * 1024,
		stats: { inactive_file: 100 * 1024 * 1024 },
	},
	...overrides,
});

const makeLogFrame = (streamType: number, text: string): Buffer => {
	const payload = Buffer.from(text);
	const header = Buffer.alloc(8);
	header.writeUInt8(streamType, 0);
	header.writeUInt32BE(payload.length, 4);
	return Buffer.concat([header, payload]);
};

const setup = (
	overrides: Partial<{
		ping: any;
		listContainers: any;
		getContainer: any;
		inspect: any;
		stats: any;
		logs: any;
		encryptionService: IEncryptionService;
	}> = {}
) => {
	const inspect = overrides.inspect ?? jest.fn().mockResolvedValue(makeInspect());
	const stats = overrides.stats ?? jest.fn().mockResolvedValue(makeStats());
	const logs = overrides.logs ?? jest.fn().mockResolvedValue(Buffer.alloc(0));
	const getContainer = overrides.getContainer ?? jest.fn().mockReturnValue({ inspect, stats, logs });
	const instance = {
		ping: overrides.ping ?? jest.fn().mockResolvedValue("OK"),
		listContainers: overrides.listContainers ?? jest.fn().mockResolvedValue([makeContainer()]),
		getContainer,
	};
	const DockerLib = jest.fn().mockReturnValue(instance) as any;
	const logger = createMockLogger();
	const encryptionService = overrides.encryptionService ?? makeEncryptionService();
	const provider = new DockerProvider(logger as any, DockerLib, encryptionService);
	return {
		provider,
		logger,
		DockerLib,
		encryptionService,
		ping: instance.ping,
		listContainers: instance.listContainers,
		getContainer,
		inspect,
		stats,
		logs,
	};
};

// ── Contract ─────────────────────────────────────────────────────────────────

testStatusProviderContract("DockerProvider", {
	create: () => setup().provider,
	supportedType: "docker",
	unsupportedType: "http",
	makeMonitor: () => makeMonitor(),
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("DockerProvider", () => {
	// ── Host url parsing ─────────────────────────────────────────────────

	describe("host url parsing", () => {
		it("parses unix:// urls into socketPath", async () => {
			const { provider, DockerLib } = setup();

			await provider.handle(makeMonitor({ url: "unix:///run/docker.sock" }));

			expect(DockerLib).toHaveBeenCalledWith({ socketPath: "/run/docker.sock", ...TIMEOUTS });
		});

		it("parses bare absolute paths into socketPath", async () => {
			const { provider, DockerLib } = setup();

			await provider.handle(makeMonitor({ url: "/var/run/docker.sock" }));

			expect(DockerLib).toHaveBeenCalledWith({ socketPath: "/var/run/docker.sock", ...TIMEOUTS });
		});

		it("trims surrounding whitespace", async () => {
			const { provider, DockerLib } = setup();

			await provider.handle(makeMonitor({ url: "  /var/run/docker.sock  " }));

			expect(DockerLib).toHaveBeenCalledWith({ socketPath: "/var/run/docker.sock", ...TIMEOUTS });
		});
	});

	// ── TLS host urls ────────────────────────────────────────────────────

	describe("tls host urls", () => {
		const ctx = { dockerTlsKey: KEY_CIPHERTEXT };
		const optionsPassedTo = (DockerLib: jest.Mock) => DockerLib.mock.calls[0]?.[0] as Record<string, unknown>;
		const agentOf = (options: Record<string, unknown>) => options.agent as https.Agent & { options: Record<string, unknown> };

		it("parses tcp:// into an https connection with the monitor's ca and cert and the decrypted key", async () => {
			const { provider, DockerLib, encryptionService } = setup();

			await provider.handle(makeTlsMonitor(), ctx);

			expect(encryptionService.decrypt).toHaveBeenCalledWith(KEY_CIPHERTEXT);
			const options = optionsPassedTo(DockerLib);
			expect(options).toMatchObject({ host: "host", port: 2376, protocol: "https", ca: [CA_PEM], cert: CERT_PEM, key: KEY_PEM });
			expect(agentOf(options)).toBeInstanceOf(https.Agent);
			expect(agentOf(options).options).toMatchObject({ ca: [CA_PEM], cert: CERT_PEM, key: KEY_PEM, rejectUnauthorized: true });
		});

		it("parses https:// with an explicit port", async () => {
			const { provider, DockerLib } = setup();

			await provider.handle(makeTlsMonitor({ url: "https://host:2377" }), ctx);

			expect(optionsPassedTo(DockerLib)).toMatchObject({ host: "host", port: 2377, protocol: "https" });
		});

		it("accepts a trailing slash", async () => {
			const { provider, DockerLib } = setup();

			await provider.handle(makeTlsMonitor({ url: "tcp://host:2376/" }), ctx);

			expect(optionsPassedTo(DockerLib)).toMatchObject({ host: "host", port: 2376 });
		});

		it("splits a ca bundle into one entry per certificate on the options and the agent", async () => {
			const { provider, DockerLib } = setup();

			await provider.handle(makeTlsMonitor({ dockerTlsCa: CA_BUNDLE_PEM }), ctx);

			const options = optionsPassedTo(DockerLib);
			expect(options.ca).toHaveLength(2);
			expect(agentOf(options).options.ca).toEqual(options.ca);
		});

		it("omits the ca and stops rejecting unauthorized certificates when ignoreTlsErrors is set", async () => {
			const { provider, DockerLib } = setup();

			await provider.handle(makeTlsMonitor({ ignoreTlsErrors: true }), ctx);

			const options = optionsPassedTo(DockerLib);
			expect(options.ca).toBeUndefined();
			expect(agentOf(options).options).toMatchObject({ ca: undefined, rejectUnauthorized: false });
		});

		it("passes explicit undefined for every field docker-modem would otherwise fill from the environment", async () => {
			const { provider, DockerLib } = setup();

			await provider.handle(makeTlsMonitor(), ctx);

			const options = optionsPassedTo(DockerLib);
			for (const field of ["socketPath", "username", "sshOptions"]) {
				expect(options).toHaveProperty(field, undefined);
			}
		});

		it("bounds every request with the provider timeout so a filtered port fails fast", async () => {
			const { provider, DockerLib } = setup();

			await provider.handle(makeTlsMonitor(), ctx);

			expect(optionsPassedTo(DockerLib)).toMatchObject(TIMEOUTS);
		});

		it("returns a down check and never constructs a client when the key is missing from the context", async () => {
			const { provider, DockerLib, encryptionService } = setup();

			const result = await provider.handle(makeTlsMonitor());

			expect(result).toMatchObject({ status: false, code: NETWORK_ERROR, message: "Docker TLS key is missing", payload: null });
			expect(encryptionService.decrypt).not.toHaveBeenCalled();
			expect(DockerLib).not.toHaveBeenCalled();
		});

		it("returns a down check naming the key id when the stored key cannot be decrypted", async () => {
			const decrypt = jest.fn(() => {
				throw new AppError({
					message: "No encryption key matches ciphertext",
					status: 500,
					service: "EncryptionService",
					method: "decrypt",
					details: { keyId: "abc123" },
				});
			});
			const { provider, DockerLib } = setup({ encryptionService: makeEncryptionService({ decrypt }) });

			const result = await provider.handle(makeTlsMonitor(), ctx);

			expect(result).toMatchObject({ status: false, code: NETWORK_ERROR, message: "No encryption key matches ciphertext (key id abc123)" });
			expect(DockerLib).not.toHaveBeenCalled();
		});

		it("returns a generic down check when decryption fails with a non-AppError", async () => {
			const decrypt = jest.fn(() => {
				throw new Error("boom");
			});
			const { provider, DockerLib } = setup({ encryptionService: makeEncryptionService({ decrypt }) });

			const result = await provider.handle(makeTlsMonitor(), ctx);

			expect(result).toMatchObject({ status: false, message: "Docker TLS key could not be decrypted" });
			expect(DockerLib).not.toHaveBeenCalled();
		});

		it("does not touch the encryption service for socket monitors", async () => {
			const { provider, encryptionService } = setup();

			await provider.handle(makeMonitor(), ctx);

			expect(encryptionService.decrypt).not.toHaveBeenCalled();
		});
	});

	// ── Fail-loudly url validation ───────────────────────────────────────

	describe("invalid host urls", () => {
		const invalidUrls: [label: string, url: string, message: string][] = [
			["empty url", "", "Docker host URL is required"],
			["unix:// with an empty path", "unix://", "Invalid Docker host URL"],
			["unix:// with a relative path", "unix://run/docker.sock", "Invalid Docker host URL"],
			["garbage", "not-a-url", "Invalid Docker host URL"],
			["a container name (old semantics)", "my-container", "Invalid Docker host URL"],
			["http engine urls (plaintext tcp is unsupported)", "http://host", "Invalid Docker host URL"],
			["a bare host and port", "host:2376", "Invalid Docker host URL"],
			["a tcp url with a path", "tcp://host/engine", "Invalid Docker host URL"],
			["ssh engine urls (unsupported)", "ssh://deploy@host", "Invalid Docker host URL"],
		];

		it.each(invalidUrls)("throws AppError for %s and never constructs a client", async (_label, url, message) => {
			const { provider, DockerLib } = setup();

			await expect(provider.handle(makeMonitor({ url }))).rejects.toThrow(message);
			expect(DockerLib).not.toHaveBeenCalled();
		});

		it("preserves the toDockerOptions AppError through handle's catch", async () => {
			const { provider } = setup();

			await expect(provider.handle(makeMonitor({ url: "not-a-url" }))).rejects.toMatchObject({
				service: "DockerProvider",
				method: "toDockerOptions",
				status: 422,
			});
			await expect(provider.handle(makeMonitor({ url: "not-a-url" }))).rejects.toBeInstanceOf(AppError);
		});
	});

	// ── Host reachability ────────────────────────────────────────────────

	describe("host reachability", () => {
		it("returns a down check with NETWORK_ERROR when ping rejects with a plain Error", async () => {
			const { provider, listContainers } = setup({ ping: jest.fn().mockRejectedValue(new Error("ECONNREFUSED")) });

			const result = await provider.handle(makeMonitor());

			expect(result.status).toBe(false);
			expect(result.code).toBe(NETWORK_ERROR);
			expect(result.message).toBe("ECONNREFUSED");
			expect(result.payload).toBeNull();
			expect(listContainers).not.toHaveBeenCalled();
		});

		it("uses the DockerError statusCode and json message when ping rejects with one", async () => {
			const dockerErr = Object.assign(new Error("base"), { statusCode: 500, json: { message: "engine exploded" } });
			const { provider } = setup({ ping: jest.fn().mockRejectedValue(dockerErr) });

			const result = await provider.handle(makeMonitor());

			expect(result.code).toBe(500);
			expect(result.message).toBe("engine exploded");
		});

		it("falls back to the DockerError reason when json has no message", async () => {
			const dockerErr = Object.assign(new Error("base"), { statusCode: 500, reason: "server error", json: {} });
			const { provider } = setup({ ping: jest.fn().mockRejectedValue(dockerErr) });

			const result = await provider.handle(makeMonitor());

			expect(result.message).toBe("server error");
		});

		it("uses the default message when ping rejects with a non-Error", async () => {
			const { provider } = setup({ ping: jest.fn().mockRejectedValue("nope") });

			const result = await provider.handle(makeMonitor());

			expect(result.status).toBe(false);
			expect(result.message).toBe("Docker host is unreachable");
		});
	});

	// ── Happy path ───────────────────────────────────────────────────────

	describe("container payload", () => {
		it("returns an up check with enriched containers and summary counts", async () => {
			const { provider } = setup();

			const result = await provider.handle(makeMonitor());

			expect(result.status).toBe(true);
			expect(result.code).toBe(200);
			expect(result.message).toBe("Docker host is reachable");
			expect(result.payload?.summary).toEqual({ total: 1, running: 1, stopped: 0, unhealthy: 0 });
			expect(result.payload?.containers[0]).toEqual(
				expect.objectContaining({
					id: makeContainer().Id,
					name: "my-container",
					image: "nginx:latest",
					state: "running",
					status: "Up 3 hours (healthy)",
					health: "healthy",
					restartCount: 2,
					startedAt: "2026-08-28T10:00:00.000Z",
				})
			);
		});

		it("counts running, stopped, and unhealthy states in the summary", async () => {
			const containers = [
				makeContainer({ Id: "a".repeat(64) }),
				makeContainer({ Id: "b".repeat(64), State: "exited" }),
				makeContainer({ Id: "c".repeat(64), State: "dead" }),
				makeContainer({ Id: "d".repeat(64), State: "paused" }),
			];
			const inspect = jest.fn().mockResolvedValue(makeInspect({ State: { Health: { Status: "unhealthy" } } }));
			const { provider } = setup({ listContainers: jest.fn().mockResolvedValue(containers), inspect });

			const result = await provider.handle(makeMonitor());

			expect(result.payload?.summary).toEqual({ total: 4, running: 1, stopped: 2, unhealthy: 4 });
		});

		it("falls back to a truncated id when a container has no name", async () => {
			const container = makeContainer({ Names: [] });
			const { provider } = setup({ listContainers: jest.fn().mockResolvedValue([container]) });

			const result = await provider.handle(makeMonitor());

			expect(result.payload?.containers[0]?.name).toBe(container.Id.slice(0, 12));
		});

		it("clamps unknown container states and health statuses", async () => {
			const container = makeContainer({ State: "warp-speed" });
			const inspect = jest.fn().mockResolvedValue(makeInspect({ State: { Health: { Status: "confused" } } }));
			const { provider } = setup({ listContainers: jest.fn().mockResolvedValue([container]), inspect });

			const result = await provider.handle(makeMonitor());

			expect(result.payload?.containers[0]?.state).toBe("created");
			expect(result.payload?.containers[0]?.health).toBe("none");
		});
	});

	describe("container logs", () => {
		it("parses multiplexed stdout and stderr with normalized timestamps", async () => {
			const logs = jest
				.fn()
				.mockResolvedValue(
					Buffer.concat([makeLogFrame(1, "2026-01-01T00:00:37.1Z ready\n"), makeLogFrame(2, "2026-01-01T00:00:38.123Z failed\r\n")])
				);
			const { provider } = setup({ logs });

			const result = await provider.handle(makeMonitor({ dockerLogsEnabled: true }));

			expect(result.payload?.logs?.[0]?.lines).toEqual([
				{ ts: "2026-01-01T00:00:37.100000000Z", stream: "stdout", text: "ready" },
				{ ts: "2026-01-01T00:00:38.123000000Z", stream: "stderr", text: "failed" },
			]);
		});

		it("treats raw TTY output as stdout and drops lines without timestamps", async () => {
			const logs = jest.fn().mockResolvedValue(Buffer.from("noise\n2026-01-01T00:00:00Z first\n2026-01-01T00:00:01.12Z second\n"));
			const { provider } = setup({ logs });

			const result = await provider.handle(makeMonitor({ dockerLogsEnabled: true }));

			expect(result.payload?.logs?.[0]?.lines).toEqual([
				{ ts: "2026-01-01T00:00:00.000000000Z", stream: "stdout", text: "first" },
				{ ts: "2026-01-01T00:00:01.120000000Z", stream: "stdout", text: "second" },
			]);
		});

		it("truncates oversized UTF-8 lines and appends the marker", async () => {
			const logs = jest.fn().mockResolvedValue(Buffer.from(`2026-01-01T00:00:00Z ${"x".repeat(5000)}\n`));
			const { provider } = setup({ logs });

			const result = await provider.handle(makeMonitor({ dockerLogsEnabled: true }));
			const text = result.payload?.logs?.[0]?.lines[0]?.text;
			expect(text).toEqual(expect.stringMatching(/ …\[truncated\]$/));
			expect(Buffer.byteLength(text?.replace(" …[truncated]", "") ?? "", "utf8")).toBeLessThanOrEqual(4096);
		});

		it("isolates a logs failure and warns", async () => {
			const { provider, logger } = setup({ logs: jest.fn().mockRejectedValue(new Error("logs failed")) });

			const result = await provider.handle(makeMonitor({ dockerLogsEnabled: true }));

			expect(result.payload?.logs).toEqual([]);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "Failed to read logs for container my-container" }));
		});

		it("requests a bounded timestamped tail for every container state", async () => {
			const containers = [makeContainer({ Id: "a".repeat(64) }), makeContainer({ Id: "b".repeat(64), State: "exited" })];
			const { provider, logs } = setup({ listContainers: jest.fn().mockResolvedValue(containers) });

			await provider.handle(makeMonitor({ dockerLogsEnabled: true }));

			expect(logs).toHaveBeenCalledTimes(2);
			expect(logs).toHaveBeenCalledWith({ follow: false, stdout: true, stderr: true, timestamps: true, tail: DOCKER_LOG_TAIL_LINES });
		});

		it("does not read logs when dockerLogsEnabled is false", async () => {
			const { provider, logs } = setup();

			const result = await provider.handle(makeMonitor({ dockerLogsEnabled: false }));

			expect(logs).not.toHaveBeenCalled();
			expect(result.payload?.logs).toBeUndefined();
		});

		it("does not read logs when dockerLogsEnabled is unset", async () => {
			const { provider, logs } = setup();

			const result = await provider.handle(makeMonitor());

			expect(logs).not.toHaveBeenCalled();
			expect(result.payload?.logs).toBeUndefined();
		});
	});

	// ── Enrichment fault isolation ───────────────────────────────────────

	describe("enrichment fault isolation", () => {
		it("keeps the container and the up status when inspect rejects", async () => {
			const inspect = jest.fn().mockRejectedValue(new Error("inspect failed"));
			const { provider, logger } = setup({ inspect });

			const result = await provider.handle(makeMonitor());

			expect(result.status).toBe(true);
			expect(result.payload?.containers).toHaveLength(1);
			expect(result.payload?.containers[0]).toEqual(expect.objectContaining({ health: "none" }));
			expect(result.payload?.containers[0]?.restartCount).toBeUndefined();
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Failed to inspect") }));
		});

		it("keeps the container without metrics when stats rejects", async () => {
			const stats = jest.fn().mockRejectedValue(new Error("stats failed"));
			const { provider } = setup({ stats });

			const result = await provider.handle(makeMonitor());

			expect(result.status).toBe(true);
			expect(result.payload?.containers[0]?.cpuPct).toBeUndefined();
			expect(result.payload?.containers[0]?.memoryUsedBytes).toBeUndefined();
		});

		it("only requests stats for running containers", async () => {
			const containers = [makeContainer({ Id: "a".repeat(64) }), makeContainer({ Id: "b".repeat(64), State: "exited" })];
			const { provider, stats } = setup({ listContainers: jest.fn().mockResolvedValue(containers) });

			await provider.handle(makeMonitor());

			expect(stats).toHaveBeenCalledTimes(1);
		});
	});

	// ── Metric math ──────────────────────────────────────────────────────

	describe("metric math", () => {
		it("computes cpu and memory percentages from cgroup v2 stats", async () => {
			const { provider } = setup();

			const result = await provider.handle(makeMonitor());
			const container = result.payload?.containers[0];

			expect(container?.cpuPct).toBeCloseTo(0.8);
			expect(container?.memoryUsedBytes).toBe(200 * 1024 * 1024);
			expect(container?.memoryLimitBytes).toBe(1024 * 1024 * 1024);
			expect(container?.memoryPct).toBeCloseTo(0.1953125);
		});

		it("falls back to the cgroup v1 cache field for page cache", async () => {
			const stats = jest
				.fn()
				.mockResolvedValue(makeStats({ memory_stats: { usage: 300 * 1024 * 1024, limit: 1024 * 1024 * 1024, stats: { cache: 50 * 1024 * 1024 } } }));
			const { provider } = setup({ stats });

			const result = await provider.handle(makeMonitor());

			expect(result.payload?.containers[0]?.memoryUsedBytes).toBe(250 * 1024 * 1024);
		});

		it("derives cpu count from percpu_usage when online_cpus is absent", async () => {
			const stats = jest.fn().mockResolvedValue(
				makeStats({
					cpu_stats: { cpu_usage: { total_usage: 400_000_000, percpu_usage: [1, 2] }, system_cpu_usage: 2_000_000_000 },
				})
			);
			const { provider } = setup({ stats });

			const result = await provider.handle(makeMonitor());

			expect(result.payload?.containers[0]?.cpuPct).toBeCloseTo(0.4);
		});

		it("returns 0 cpu when the system delta is not positive", async () => {
			const stats = jest
				.fn()
				.mockResolvedValue(makeStats({ precpu_stats: { cpu_usage: { total_usage: 200_000_000 }, system_cpu_usage: 2_000_000_000 } }));
			const { provider } = setup({ stats });

			const result = await provider.handle(makeMonitor());

			expect(result.payload?.containers[0]?.cpuPct).toBe(0);
		});

		it("returns 0 memory percent when there is no limit", async () => {
			const stats = jest.fn().mockResolvedValue(makeStats({ memory_stats: { usage: 300 * 1024 * 1024, limit: 0, stats: {} } }));
			const { provider } = setup({ stats });

			const result = await provider.handle(makeMonitor());

			expect(result.payload?.containers[0]?.memoryPct).toBe(0);
		});
	});

	// ── Ports and mounts ─────────────────────────────────────────────────

	describe("ports and mounts", () => {
		it("maps published and unpublished ports and mounts from inspect", async () => {
			const inspect = jest.fn().mockResolvedValue(
				makeInspect({
					NetworkSettings: {
						Ports: {
							"80/tcp": [{ HostIp: "0.0.0.0", HostPort: "8080" }],
							"443/tcp": null,
						},
					},
					Mounts: [
						{
							Type: "volume",
							Name: "mongo_data",
							Source: "/var/lib/docker/volumes/mongo_data/_data",
							Destination: "/data/db",
							Mode: "z",
							RW: true,
						},
						{ Type: "bind", Source: "/srv/config", Destination: "/etc/app", Mode: "ro", RW: false },
					],
				})
			);
			const { provider } = setup({ inspect });

			const result = await provider.handle(makeMonitor());

			const container = result.payload?.containers[0];
			expect(container?.ports).toEqual([
				{ privatePort: 80, protocol: "tcp", publicPort: 8080, hostIp: "0.0.0.0" },
				{ privatePort: 443, protocol: "tcp" },
			]);
			expect(container?.mounts).toEqual([
				{ type: "volume", name: "mongo_data", source: "/var/lib/docker/volumes/mongo_data/_data", destination: "/data/db", mode: "z", rw: true },
				{ type: "bind", name: undefined, source: "/srv/config", destination: "/etc/app", mode: "ro", rw: false },
			]);
		});

		it("emits one port entry per host binding", async () => {
			const inspect = jest.fn().mockResolvedValue(
				makeInspect({
					NetworkSettings: {
						Ports: {
							"80/tcp": [
								{ HostIp: "0.0.0.0", HostPort: "8080" },
								{ HostIp: "::", HostPort: "8080" },
							],
						},
					},
				})
			);
			const { provider } = setup({ inspect });

			const result = await provider.handle(makeMonitor());

			expect(result.payload?.containers[0]?.ports).toEqual([
				{ privatePort: 80, protocol: "tcp", publicPort: 8080, hostIp: "0.0.0.0" },
				{ privatePort: 80, protocol: "tcp", publicPort: 8080, hostIp: "::" },
			]);
		});

		it("maps missing ports and mounts to empty arrays", async () => {
			const { provider } = setup();

			const result = await provider.handle(makeMonitor());

			expect(result.payload?.containers[0]?.ports).toEqual([]);
			expect(result.payload?.containers[0]?.mounts).toEqual([]);
		});

		it("leaves ports and mounts undefined when inspect fails", async () => {
			const inspect = jest.fn().mockRejectedValue(new Error("inspect failed"));
			const { provider } = setup({ inspect });

			const result = await provider.handle(makeMonitor());

			expect(result.payload?.containers[0]?.ports).toBeUndefined();
			expect(result.payload?.containers[0]?.mounts).toBeUndefined();
		});
	});

	// ── Outer error handling ─────────────────────────────────────────────

	describe("outer error handling", () => {
		it("throws AppError when listContainers rejects after a successful ping", async () => {
			const { provider } = setup({ listContainers: jest.fn().mockRejectedValue(new Error("Docker daemon unavailable")) });

			await expect(provider.handle(makeMonitor())).rejects.toThrow("Docker daemon unavailable");
		});

		it("throws AppError with the default message for non-Error thrown values", async () => {
			const { provider } = setup({ listContainers: jest.fn().mockRejectedValue(null) });

			await expect(provider.handle(makeMonitor())).rejects.toThrow("Error performing Docker request");
		});
	});
});
