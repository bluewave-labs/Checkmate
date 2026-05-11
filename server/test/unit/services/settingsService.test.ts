import { describe, expect, it, jest } from "@jest/globals";
import { SettingsService } from "../../../src/service/system/settingsService.ts";
import type { ISettingsRepository } from "../../../src/repositories/settings/ISettingsRepository.ts";
import type { ValidatedEnv } from "../../../src/validation/envValidation.ts";
import type { Settings } from "../../../src/types/index.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeEnv = (overrides?: Partial<ValidatedEnv>): ValidatedEnv =>
	({
		JWT_SECRET: "test-secret",
		TOKEN_TTL: "99d",
		NODE_ENV: "development",
		LOG_LEVEL: "debug",
		CLIENT_HOST: "http://localhost:5173",
		DB_CONNECTION_STRING: "mongodb://localhost:27017/test_db",
		DB_TYPE: "mongodb",
		STATUS_PAGE_THEMES_ENABLED: false,
		...overrides,
	}) as ValidatedEnv;

const makeSettings = (overrides?: Partial<Settings>): Settings =>
	({
		id: "settings-1",
		checkTTL: 30,
		language: "en",
		systemEmailSecure: false,
		systemEmailPool: false,
		systemEmailIgnoreTLS: false,
		systemEmailRequireTLS: false,
		systemEmailRejectUnauthorized: false,
		showURL: true,
		singleton: true,
		version: 1,
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
		...overrides,
	}) as Settings;

const createSettingsRepo = () =>
	({
		create: jest.fn().mockResolvedValue(makeSettings()),
		findSingleton: jest.fn().mockResolvedValue(makeSettings()),
		update: jest.fn().mockResolvedValue(makeSettings()),
		deleteLegacy: jest.fn().mockResolvedValue(true),
	}) as unknown as jest.Mocked<ISettingsRepository>;

const createService = (envOverrides?: Partial<ValidatedEnv>) => {
	const env = makeEnv(envOverrides);
	const service = new SettingsService(env);
	const settingsRepository = createSettingsRepo();
	service.setRepository(settingsRepository);
	return { service, settingsRepository, env };
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("SettingsService", () => {
	describe("serviceName", () => {
		it("returns SettingsService from static property", () => {
			expect(SettingsService.SERVICE_NAME).toBe("SettingsService");
		});

		it("returns SettingsService from instance getter", () => {
			const { service } = createService();
			expect(service.serviceName).toBe("SettingsService");
		});
	});

	// ── loadSettings ────────────────────────────────────────────────────────

	describe("loadSettings", () => {
		it("returns env config mapped from constructor", () => {
			const { service } = createService();
			const settings = service.loadSettings();

			expect(settings).toEqual({
				jwtSecret: "test-secret",
				jwtTTL: "99d",
				nodeEnv: "development",
				logLevel: "debug",
				clientHost: "http://localhost:5173",
				dbConnectionString: "mongodb://localhost:27017/test_db",
				dbType: "mongodb",
				statusPageThemesEnabled: false,
			});
		});

		it("reflects custom env values", () => {
			const { service } = createService({ NODE_ENV: "production", LOG_LEVEL: "error" });
			const settings = service.loadSettings();

			expect(settings.nodeEnv).toBe("production");
			expect(settings.logLevel).toBe("error");
		});
	});

	// ── getSettings ─────────────────────────────────────────────────────────

	describe("getSettings", () => {
		it("returns the same config as loadSettings", () => {
			const { service } = createService();

			expect(service.getSettings()).toEqual(service.loadSettings());
		});
	});

	// ── areStatusPageThemesEnabled ──────────────────────────────────────────

	describe("areStatusPageThemesEnabled", () => {
		it("returns false when STATUS_PAGE_THEMES_ENABLED env is false", () => {
			const { service } = createService({ STATUS_PAGE_THEMES_ENABLED: false });

			expect(service.areStatusPageThemesEnabled()).toBe(false);
		});

		it("returns true when STATUS_PAGE_THEMES_ENABLED env is true", () => {
			const { service } = createService({ STATUS_PAGE_THEMES_ENABLED: true });

			expect(service.areStatusPageThemesEnabled()).toBe(true);
		});
	});

	// ── setRepository ───────────────────────────────────────────────────────

	describe("setRepository", () => {
		it("allows DB methods to work after being called", async () => {
			const env = makeEnv();
			const service = new SettingsService(env);
			const repo = createSettingsRepo();

			service.setRepository(repo);
			const settings = await service.getDBSettings();

			expect(settings).toEqual(makeSettings());
		});
	});

	// ── getDBSettings ───────────────────────────────────────────────────────

	describe("getDBSettings", () => {
		it("deletes legacy settings and returns singleton", async () => {
			const { service, settingsRepository } = createService();
			const expected = makeSettings();
			(settingsRepository.findSingleton as jest.Mock).mockResolvedValue(expected);

			const result = await service.getDBSettings();

			expect(settingsRepository.deleteLegacy).toHaveBeenCalled();
			expect(settingsRepository.findSingleton).toHaveBeenCalled();
			expect(result).toBe(expected);
		});

		it("creates default settings when singleton is null, then returns them", async () => {
			const { service, settingsRepository } = createService();
			const created = makeSettings();
			(settingsRepository.findSingleton as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(created);

			const result = await service.getDBSettings();

			expect(settingsRepository.create).toHaveBeenCalledWith({});
			expect(settingsRepository.findSingleton).toHaveBeenCalledTimes(2);
			expect(result).toBe(created);
		});

		it("throws when settings are still null after creation attempt", async () => {
			const { service, settingsRepository } = createService();
			(settingsRepository.findSingleton as jest.Mock).mockResolvedValue(null);

			await expect(service.getDBSettings()).rejects.toThrow("Settings not found");
		});

		it("throws when repository is not set", async () => {
			const env = makeEnv();
			const service = new SettingsService(env);

			await expect(service.getDBSettings()).rejects.toThrow("Settings repository not initialized");
		});
	});

	// ── updateDbSettings ────────────────────────────────────────────────────

	describe("updateDbSettings", () => {
		it("delegates to repository and returns updated settings", async () => {
			const updated = makeSettings({ checkTTL: 60 });
			const { service, settingsRepository } = createService();
			(settingsRepository.update as jest.Mock).mockResolvedValue(updated);

			const result = await service.updateDbSettings({ checkTTL: 60 });

			expect(result).toBe(updated);
			expect(settingsRepository.update).toHaveBeenCalledWith({ checkTTL: 60 });
		});

		it("throws when repository is not set", async () => {
			const env = makeEnv();
			const service = new SettingsService(env);

			await expect(service.updateDbSettings({ checkTTL: 60 })).rejects.toThrow("Settings repository not initialized");
		});
	});
});
