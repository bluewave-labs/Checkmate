import sinon from "sinon";
import HardwareCheck from "../../db/models/HardwareCheck.js";
import { createHardwareCheck } from "../../db/mongo/modules/hardwareCheckModule.js";
import Monitor from "../../db/models/Monitor.js";
import logger from "../../utils/logger.js";

const mockHardwareCheck = {
	data: {
		cpu: {
			physical_core: 4,
			logical_core: 8,
			frequency: 4800,
			current_frequency: 1411,
			temperature: [45, 50, 46, 47, 45, 50, 46, 47],
			free_percent: 0.8552990910595134,
			usage_percent: 0.14470090894048657,
		},
		memory: {
			total_bytes: 16467628032,
			available_bytes: 7895044096,
			used_bytes: 6599561216,
			usage_percent: 0.4008,
		},
		disk: [
			{
				read_speed_bytes: null,
				write_speed_bytes: null,
				total_bytes: 931258499072,
				free_bytes: 737097256960,
				usage_percent: 0.1661,
			},
		],
		host: {
			os: "linux",
			platform: "ubuntu",
			kernel_version: "6.8.0-48-generic",
		},
	},
	errors: [
		{
			metric: ["cpu.temperature"],
			err: "unable to read CPU temperature",
		},
	],
};

const mockMonitor = {
	_id: "123",
	uptimePercentage: 1,
	status: true,
	save: () => this,
};

describe("HardwareCheckModule", function () {
	let hardwareCheckSaveStub,
		hardwareCheckCountDocumentsStub,
		monitorFindByIdStub,
		loggerStub;

	beforeEach(function () {
		loggerStub = sinon.stub(logger, "error");
		hardwareCheckSaveStub = sinon.stub(HardwareCheck.prototype, "save");
		monitorFindByIdStub = sinon.stub(Monitor, "findById");
		hardwareCheckCountDocumentsStub = sinon.stub(HardwareCheck, "countDocuments");
	});

	afterEach(function () {
		sinon.restore();
	});

	describe("createHardwareCheck", function () {
		it("should return a hardware check", async function () {
			hardwareCheckSaveStub.resolves(mockHardwareCheck);
			monitorFindByIdStub.resolves(mockMonitor);
			hardwareCheckCountDocumentsStub.resolves(1);
			const hardwareCheck = await createHardwareCheck({ status: true });
			expect(hardwareCheck).to.exist;
			expect(hardwareCheck).to.deep.equal(mockHardwareCheck);
		});

		it("should return a hardware check for a check with status false", async function () {
			hardwareCheckSaveStub.resolves(mockHardwareCheck);
			monitorFindByIdStub.resolves(mockMonitor);
			hardwareCheckCountDocumentsStub.resolves(1);
			const hardwareCheck = await createHardwareCheck({ status: false });
			expect(hardwareCheck).to.exist;
			expect(hardwareCheck).to.deep.equal(mockHardwareCheck);
		});

		it("should handle an error", async function () {
			const err = new Error("test error");
			monitorFindByIdStub.resolves(mockMonitor);
			hardwareCheckSaveStub.rejects(err);
			try {
				await createHardwareCheck({});
			} catch (error) {
				expect(error).to.exist;
				expect(error).to.deep.equal(err);
			}
		});

		it("should log an error if a monitor is not found", async function () {
			monitorFindByIdStub.resolves(null);
			const res = await createHardwareCheck({});
			expect(loggerStub.calledOnce).to.be.true;
			expect(res).to.be.null;
		});

		it("should handle a monitor with undefined uptimePercentage", async function () {
			monitorFindByIdStub.resolves({ ...mockMonitor, uptimePercentage: undefined });
			hardwareCheckSaveStub.resolves(mockHardwareCheck);
			hardwareCheckCountDocumentsStub.resolves(1);
			const res = await createHardwareCheck({});
			expect(res).to.exist;
		});

		it("should handle a monitor with undefined uptimePercentage and true status", async function () {
			monitorFindByIdStub.resolves({
				...mockMonitor,
				uptimePercentage: undefined,
			});
			hardwareCheckSaveStub.resolves(mockHardwareCheck);
			hardwareCheckCountDocumentsStub.resolves(1);
			const res = await createHardwareCheck({ status: true });
			expect(res).to.exist;
		});

		it("should handle a monitor with undefined uptimePercentage and false status", async function () {
			monitorFindByIdStub.resolves({
				...mockMonitor,
				uptimePercentage: undefined,
			});
			hardwareCheckSaveStub.resolves(mockHardwareCheck);
			hardwareCheckCountDocumentsStub.resolves(1);
			const res = await createHardwareCheck({ status: false });
			expect(res).to.exist;
		});
	});
});
