import sinon from "sinon";
import SettingsService from "../../service/settingsService.js";
import { expect } from "chai";
import NetworkService from "../../service/networkService.js";
const SERVICE_NAME = "SettingsService";

describe("SettingsService", function () {
	let sandbox, mockAppSettings;

	beforeEach(function () {
		sandbox = sinon.createSandbox();
		sandbox.stub(process.env, "CLIENT_HOST").value("http://localhost");
		sandbox.stub(process.env, "JWT_SECRET").value("secret");
		sandbox.stub(process.env, "REFRESH_TOKEN_SECRET").value("refreshSecret");
		sandbox.stub(process.env, "DB_TYPE").value("postgres");
		sandbox.stub(process.env, "DB_CONNECTION_STRING").value("postgres://user:pass@localhost/db");
		sandbox.stub(process.env, "REDIS_HOST").value("localhost");
		sandbox.stub(process.env, "REDIS_PORT").value("6379");
		sandbox.stub(process.env, "TOKEN_TTL").value("3600");
		sandbox.stub(process.env, "REFRESH_TOKEN_TTL").value("86400");
		sandbox.stub(process.env, "PAGESPEED_API_KEY").value("apiKey");
		sandbox.stub(process.env, "SYSTEM_EMAIL_HOST").value("smtp.mailtrap.io");
		sandbox.stub(process.env, "SYSTEM_EMAIL_PORT").value("2525");
		sandbox.stub(process.env, "SYSTEM_EMAIL_ADDRESS").value("test@example.com");
		sandbox.stub(process.env, "SYSTEM_EMAIL_PASSWORD").value("password");
	});

	mockAppSettings = {
		settingOne: 123,
		settingTwo: 456,
	};

	afterEach(function () {
		sandbox.restore();
		sinon.restore();
	});

	describe("constructor", function () {
		it("should construct a new SettingsService", function () {
			const settingsService = new SettingsService(mockAppSettings);
			expect(settingsService.appSettings).to.equal(mockAppSettings);
		});
	});

	describe("loadSettings", function () {
		it("should load settings from DB when environment variables are not set", async function () {
			const dbSettings = { logLevel: "debug", apiBaseUrl: "http://localhost" };
			const appSettings = { findOne: sinon.stub().returns(dbSettings) };
			const settingsService = new SettingsService(appSettings);
			settingsService.settings = {};
			const result = await settingsService.loadSettings();
			expect(result).to.deep.equal(dbSettings);
		});

		it("should throw an error if settings are not found", async function () {
			const appSettings = { findOne: sinon.stub().returns(null) };
			const settingsService = new SettingsService(appSettings);
			settingsService.settings = null;

			try {
				await settingsService.loadSettings();
			} catch (error) {
				expect(error.message).to.equal("Settings not found");
				expect(error.service).to.equal(SERVICE_NAME);
				expect(error.method).to.equal("loadSettings");
			}
		});

		it("should add its method and service name to error if not present", async function () {
			const appSettings = { findOne: sinon.stub().throws(new Error("Test error")) };
			const settingsService = new SettingsService(appSettings);
			try {
				await settingsService.loadSettings();
			} catch (error) {
				expect(error.message).to.equal("Test error");
				expect(error.service).to.equal(SERVICE_NAME);
				expect(error.method).to.equal("loadSettings");
			}
		});

		it("should not add its method and service name to error if present", async function () {
			const error = new Error("Test error");
			error.method = "otherMethod";
			error.service = "OTHER_SERVICE";
			const appSettings = { findOne: sinon.stub().throws(error) };
			const settingsService = new SettingsService(appSettings);
			try {
				await settingsService.loadSettings();
			} catch (error) {
				expect(error.message).to.equal("Test error");
				expect(error.service).to.equal("OTHER_SERVICE");
				expect(error.method).to.equal("otherMethod");
			}
		});

		it("should merge DB settings with environment variables", async function () {
			const dbSettings = { logLevel: "debug", apiBaseUrl: "http://localhost" };
			const appSettings = { findOne: sinon.stub().returns(dbSettings) };
			const settingsService = new SettingsService(appSettings);
			const result = await settingsService.loadSettings();
			expect(result).to.deep.equal(settingsService.settings);
			expect(settingsService.settings.logLevel).to.equal("debug");
			expect(settingsService.settings.apiBaseUrl).to.equal("http://localhost");
		});
	});

	describe("reloadSettings", function () {
		it("should call loadSettings", async function () {
			const dbSettings = { logLevel: "debug", apiBaseUrl: "http://localhost" };
			const appSettings = { findOne: sinon.stub().returns(dbSettings) };
			const settingsService = new SettingsService(appSettings);
			settingsService.settings = {};
			const result = await settingsService.reloadSettings();
			expect(result).to.deep.equal(dbSettings);
		});
	});

	describe("getSettings", function () {
		it("should return the current settings", function () {
			const dbSettings = { logLevel: "debug", apiBaseUrl: "http://localhost" };
			const appSettings = { findOne: sinon.stub().returns(dbSettings) };
			const settingsService = new SettingsService(appSettings);
			settingsService.settings = dbSettings;
			const result = settingsService.getSettings();
			expect(result).to.deep.equal(dbSettings);
		});

		it("should throw an error if settings have not been loaded", function () {
			const appSettings = { findOne: sinon.stub().returns(null) };
			const settingsService = new SettingsService(appSettings);
			settingsService.settings = null;

			try {
				settingsService.getSettings();
			} catch (error) {
				expect(error.message).to.equal("Settings have not been loaded");
			}
		});
	});
});
