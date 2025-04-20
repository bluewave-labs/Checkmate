import sinon from "sinon";
import {
	getAppSettings,
	updateAppSettings,
} from "../../db/mongo/modules/settingsModule.js";
import AppSettings from "../../db/models/AppSettings.js";

const mockAppSettings = {
	appName: "Test App",
};

describe("SettingsModule", function () {
	let appSettingsFindOneStub, appSettingsFindOneAndUpdateStub;

	beforeEach(function () {
		appSettingsFindOneStub = sinon.stub(AppSettings, "findOne");
		appSettingsFindOneAndUpdateStub = sinon.stub(AppSettings, "findOneAndUpdate");
	});

	afterEach(function () {
		sinon.restore();
	});

	describe("getAppSettings", function () {
		it("should return app settings", async function () {
			appSettingsFindOneStub.resolves(mockAppSettings);
			const result = await getAppSettings();
			expect(result).to.deep.equal(mockAppSettings);
		});

		it("should handle an error", async function () {
			const err = new Error("Test error");
			appSettingsFindOneStub.throws(err);
			try {
				await getAppSettings();
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});

	describe("updateAppSettings", function () {
		it("should update app settings", async function () {
			appSettingsFindOneAndUpdateStub.resolves(mockAppSettings);
			const result = await updateAppSettings(mockAppSettings);
			expect(result).to.deep.equal(mockAppSettings);
		});

		it("should handle an error", async function () {
			const err = new Error("Test error");
			appSettingsFindOneAndUpdateStub.throws(err);
			try {
				await updateAppSettings(mockAppSettings);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});
});
