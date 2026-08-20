import { describe, expect, it, jest } from "@jest/globals";
import { ProxiesService } from "../../../src/domain/proxies/proxy.service.ts";
import type { Proxy } from "../../../src/domain/proxies/proxy.type.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const createProxiesRepo = () => ({
	create: jest.fn(),
	findById: jest.fn(),
	findByTeamId: jest.fn(),
	updateById: jest.fn(),
	deleteById: jest.fn(),
});

const createMonitorsRepo = () => ({
	findMonitorCountByProxyId: jest.fn(),
});

const createSettingsService = () => ({
	getDBSettings: jest.fn(),
});

const createService = () => {
	const proxiesRepository = createProxiesRepo();
	const monitorsRepository = createMonitorsRepo();
	const settingsService = createSettingsService();

	(monitorsRepository.findMonitorCountByProxyId as jest.Mock).mockResolvedValue(0);
	(settingsService.getDBSettings as jest.Mock).mockResolvedValue({ globalProxyId: null });

	const service = new ProxiesService(proxiesRepository as any, monitorsRepository as any, settingsService as any);

	return { service, proxiesRepository, monitorsRepository, settingsService };
};

const makeProxy = (overrides?: Partial<Proxy>): Proxy =>
	({
		id: "proxy-1",
		teamId: "team-1",
		name: "Egress proxy",
		protocol: "http",
		host: "proxy.internal",
		port: 3128,
		username: "user",
		password: "secret",
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
		...overrides,
	}) as Proxy;

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ProxiesService", () => {
	describe("createProxy", () => {
		it("sets teamId and delegates to repository", async () => {
			const { service, proxiesRepository } = createService();
			(proxiesRepository.create as jest.Mock).mockResolvedValue(makeProxy());

			await service.createProxy({ name: "Egress proxy", protocol: "http", host: "proxy.internal", port: 3128 }, "team-1");

			expect(proxiesRepository.create).toHaveBeenCalledWith(expect.objectContaining({ teamId: "team-1", name: "Egress proxy" }));
		});

		it("omits password from the response and reports hasPassword", async () => {
			const { service, proxiesRepository } = createService();
			(proxiesRepository.create as jest.Mock).mockResolvedValue(makeProxy());

			const result = await service.createProxy({ name: "Egress proxy" }, "team-1");

			expect(result).not.toHaveProperty("password");
			expect(result.hasPassword).toBe(true);
		});

		it("strips blank credentials before creating", async () => {
			const { service, proxiesRepository } = createService();
			(proxiesRepository.create as jest.Mock).mockResolvedValue(makeProxy({ username: undefined, password: undefined }));

			await service.createProxy({ name: "Egress proxy", username: "", password: "" }, "team-1");

			const created = (proxiesRepository.create as jest.Mock).mock.calls[0][0] as Partial<Proxy>;
			expect(created).not.toHaveProperty("username");
			expect(created).not.toHaveProperty("password");
		});
	});

	describe("getProxy", () => {
		it("delegates to repository and masks the password", async () => {
			const { service, proxiesRepository } = createService();
			(proxiesRepository.findById as jest.Mock).mockResolvedValue(makeProxy());

			const result = await service.getProxy("proxy-1", "team-1");

			expect(proxiesRepository.findById).toHaveBeenCalledWith("proxy-1", "team-1");
			expect(result).not.toHaveProperty("password");
			expect(result.hasPassword).toBe(true);
		});

		it("reports hasPassword false when none is stored", async () => {
			const { service, proxiesRepository } = createService();
			(proxiesRepository.findById as jest.Mock).mockResolvedValue(makeProxy({ password: undefined }));

			const result = await service.getProxy("proxy-1", "team-1");

			expect(result.hasPassword).toBe(false);
		});
	});

	describe("getProxiesByTeamId", () => {
		it("masks every proxy in the list", async () => {
			const { service, proxiesRepository } = createService();
			(proxiesRepository.findByTeamId as jest.Mock).mockResolvedValue([makeProxy(), makeProxy({ id: "proxy-2", password: undefined })]);

			const result = await service.getProxiesByTeamId("team-1");

			expect(proxiesRepository.findByTeamId).toHaveBeenCalledWith("team-1");
			expect(result).toHaveLength(2);
			for (const proxy of result) {
				expect(proxy).not.toHaveProperty("password");
			}
			expect(result[0].hasPassword).toBe(true);
			expect(result[1].hasPassword).toBe(false);
		});
	});

	describe("updateProxy", () => {
		it("keeps the stored password when the patch has a blank one", async () => {
			const { service, proxiesRepository } = createService();
			(proxiesRepository.updateById as jest.Mock).mockResolvedValue(makeProxy());

			await service.updateProxy("proxy-1", "team-1", { name: "Renamed", password: "", username: "" });

			const patch = (proxiesRepository.updateById as jest.Mock).mock.calls[0][2] as Partial<Proxy>;
			expect(patch).not.toHaveProperty("password");
			expect(patch).not.toHaveProperty("username");
			expect(patch.name).toBe("Renamed");
		});

		it("passes a new password through", async () => {
			const { service, proxiesRepository } = createService();
			(proxiesRepository.updateById as jest.Mock).mockResolvedValue(makeProxy({ password: "next" }));

			await service.updateProxy("proxy-1", "team-1", { password: "next" });

			const patch = (proxiesRepository.updateById as jest.Mock).mock.calls[0][2] as Partial<Proxy>;
			expect(patch.password).toBe("next");
		});

		it("maps clear flags to unset options and keeps them out of the patch", async () => {
			const { service, proxiesRepository } = createService();
			(proxiesRepository.updateById as jest.Mock).mockResolvedValue(makeProxy({ username: undefined, password: undefined }));

			await service.updateProxy("proxy-1", "team-1", { name: "Renamed", clearPassword: true, clearUsername: true });

			const [, , patch, options] = (proxiesRepository.updateById as jest.Mock).mock.calls[0];
			expect(patch).not.toHaveProperty("clearPassword");
			expect(patch).not.toHaveProperty("clearUsername");
			expect(options).toEqual({ unsetPassword: true, unsetUsername: true });
		});

		it("does not unset when clear flags are absent", async () => {
			const { service, proxiesRepository } = createService();
			(proxiesRepository.updateById as jest.Mock).mockResolvedValue(makeProxy());

			await service.updateProxy("proxy-1", "team-1", { name: "Renamed" });

			const options = (proxiesRepository.updateById as jest.Mock).mock.calls[0][3];
			expect(options).toEqual({ unsetPassword: false, unsetUsername: false });
		});

		it("masks the updated proxy in the response", async () => {
			const { service, proxiesRepository } = createService();
			(proxiesRepository.updateById as jest.Mock).mockResolvedValue(makeProxy());

			const result = await service.updateProxy("proxy-1", "team-1", { name: "Renamed" });

			expect(result).not.toHaveProperty("password");
			expect(result.hasPassword).toBe(true);
		});
	});

	describe("deleteProxy", () => {
		it("deletes when unreferenced and masks the response", async () => {
			const { service, proxiesRepository } = createService();
			(proxiesRepository.deleteById as jest.Mock).mockResolvedValue(makeProxy());

			const result = await service.deleteProxy("proxy-1", "team-1");

			expect(proxiesRepository.deleteById).toHaveBeenCalledWith("proxy-1", "team-1");
			expect(result).not.toHaveProperty("password");
		});

		it("rejects with 409 when monitors reference the proxy", async () => {
			const { service, proxiesRepository, monitorsRepository } = createService();
			(monitorsRepository.findMonitorCountByProxyId as jest.Mock).mockResolvedValue(3);

			await expect(service.deleteProxy("proxy-1", "team-1")).rejects.toMatchObject({ status: 409 });
			expect(proxiesRepository.deleteById).not.toHaveBeenCalled();
		});

		it("rejects with 409 when the proxy is the global proxy", async () => {
			const { service, proxiesRepository, settingsService } = createService();
			(settingsService.getDBSettings as jest.Mock).mockResolvedValue({ globalProxyId: "proxy-1" });

			await expect(service.deleteProxy("proxy-1", "team-1")).rejects.toMatchObject({ status: 409 });
			expect(proxiesRepository.deleteById).not.toHaveBeenCalled();
		});
	});
});
