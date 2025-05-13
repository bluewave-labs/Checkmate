import sinon from "sinon";
import Monitor from "../../db/models/Monitor.js";
import Check from "../../db/models/Check.js";
import PageSpeedCheck from "../../db/models/PageSpeedCheck.js";
import HardwareCheck from "../../db/models/HardwareCheck.js";
import Notification from "../../db/models/Notification.js";

import { errorMessages } from "../../utils/messages.js";
import {
	getAllMonitors,
	getAllMonitorsWithUptimeStats,
	getMonitorStatsById,
	getMonitorById,
	getMonitorsAndSummaryByTeamId,
	getMonitorsByTeamId,
	createMonitor,
	deleteMonitor,
	deleteAllMonitors,
	deleteMonitorsByUserId,
	editMonitor,
	addDemoMonitors,
	calculateUptimeDuration,
	getLastChecked,
	getLatestResponseTime,
	getAverageResponseTime,
	getUptimePercentage,
	getIncidents,
	getMonitorChecks,
	processChecksForDisplay,
	groupChecksByTime,
	calculateGroupStats,
} from "../../db/mongo/modules/monitorModule.js";

describe("monitorModule", function () {
	let monitorFindStub,
		monitorFindByIdStub,
		monitorFindByIdAndUpdateStub,
		monitorFindByIdAndDeleteStub,
		monitorDeleteManyStub,
		monitorCountStub,
		monitorInsertManyStub,
		checkFindStub,
		pageSpeedCheckFindStub,
		hardwareCheckFindStub;

	beforeEach(function () {
		monitorFindStub = sinon.stub(Monitor, "find");
		monitorFindByIdStub = sinon.stub(Monitor, "findById");
		monitorFindByIdAndUpdateStub = sinon.stub(Monitor, "findByIdAndUpdate");
		monitorFindByIdAndDeleteStub = sinon.stub(Monitor, "findByIdAndDelete");
		monitorDeleteManyStub = sinon.stub(Monitor, "deleteMany");
		monitorCountStub = sinon.stub(Monitor, "countDocuments");

		monitorInsertManyStub = sinon.stub(Monitor, "insertMany");
		checkFindStub = sinon.stub(Check, "find").returns({
			sort: sinon.stub(),
		});
		pageSpeedCheckFindStub = sinon.stub(PageSpeedCheck, "find").returns({
			sort: sinon.stub(),
		});
		hardwareCheckFindStub = sinon.stub(HardwareCheck, "find").returns({
			sort: sinon.stub(),
		});
	});

	afterEach(function () {
		sinon.restore();
	});

	describe("getAllMonitors", function () {
		it("should return all monitors", async function () {
			const mockMonitors = [
				{ _id: "1", name: "Monitor 1", url: "test1.com" },
				{ _id: "2", name: "Monitor 2", url: "test2.com" },
			];
			monitorFindStub.returns(mockMonitors);
			const result = await getAllMonitors();

			expect(result).to.deep.equal(mockMonitors);
			expect(monitorFindStub.calledOnce).to.be.true;
			expect(monitorFindStub.firstCall.args).to.deep.equal([]);
		});

		it("should handle empty results", async function () {
			monitorFindStub.returns([]);
			const result = await getAllMonitors();
			expect(result).to.be.an("array").that.is.empty;
		});

		it("should throw error when database fails", async function () {
			// Arrange
			const error = new Error("Database error");
			error.service = "MonitorModule";
			error.method = "getAllMonitors";
			monitorFindStub.rejects(error);
			// Act & Assert
			try {
				await getAllMonitors();
				expect.fail("Should have thrown an error");
			} catch (err) {
				expect(err).to.equal(error);
				expect(err.service).to.equal("monitorModule");
				expect(err.method).to.equal("getAllMonitors");
			}
		});
	});

	describe("getAllMonitorsWithUptimeStats", function () {
		it("should return monitors with uptime stats for different time periods", async function () {
			// Mock data
			const mockMonitors = [
				{
					_id: "monitor1",
					type: "http",
					toObject: () => ({
						_id: "monitor1",
						type: "http",
						name: "Test Monitor",
					}),
				},
			];

			const mockChecks = [
				{ status: true },
				{ status: true },
				{ status: false },
				{ status: true },
			];

			monitorFindStub.resolves(mockMonitors);
			checkFindStub.resolves(mockChecks);

			const result = await getAllMonitorsWithUptimeStats();

			expect(result).to.be.an("array");
			expect(result).to.have.lengthOf(1);

			const monitor = result[0];
			expect(monitor).to.have.property("_id", "monitor1");
			expect(monitor).to.have.property("name", "Test Monitor");

			// Check uptime percentages exist for all time periods
			expect(monitor).to.have.property("1");
			expect(monitor).to.have.property("7");
			expect(monitor).to.have.property("30");
			expect(monitor).to.have.property("90");

			// Verify uptime percentage calculation (3 successful out of 4 = 75%)
			expect(monitor["1"]).to.equal(75);
			expect(monitor["7"]).to.equal(75);
			expect(monitor["30"]).to.equal(75);
			expect(monitor["90"]).to.equal(75);
		});

		it("should return monitors with stats for pagespeed type", async function () {
			// Mock data
			const mockMonitors = [
				{
					_id: "monitor1",
					type: "pagespeed",
					toObject: () => ({
						_id: "monitor1",
						type: "pagespeed",
						name: "Test Monitor",
					}),
				},
			];

			const mockChecks = [
				{ status: true },
				{ status: true },
				{ status: false },
				{ status: true },
			];

			monitorFindStub.resolves(mockMonitors);
			pageSpeedCheckFindStub.resolves(mockChecks);

			const result = await getAllMonitorsWithUptimeStats();

			expect(result).to.be.an("array");
			expect(result).to.have.lengthOf(1);

			const monitor = result[0];
			expect(monitor).to.have.property("_id", "monitor1");
			expect(monitor).to.have.property("name", "Test Monitor");

			// Check uptime percentages exist for all time periods
			expect(monitor).to.have.property("1");
			expect(monitor).to.have.property("7");
			expect(monitor).to.have.property("30");
			expect(monitor).to.have.property("90");

			// Verify uptime percentage calculation (3 successful out of 4 = 75%)
			expect(monitor["1"]).to.equal(75);
			expect(monitor["7"]).to.equal(75);
			expect(monitor["30"]).to.equal(75);
			expect(monitor["90"]).to.equal(75);
		});

		it("should return monitors with stats for hardware type", async function () {
			// Mock data
			const mockMonitors = [
				{
					_id: "monitor1",
					type: "hardware",
					toObject: () => ({
						_id: "monitor1",
						type: "hardware",
						name: "Test Monitor",
					}),
				},
			];

			const mockChecks = [
				{ status: true },
				{ status: true },
				{ status: false },
				{ status: true },
			];

			monitorFindStub.resolves(mockMonitors);
			hardwareCheckFindStub.resolves(mockChecks);

			const result = await getAllMonitorsWithUptimeStats();

			expect(result).to.be.an("array");
			expect(result).to.have.lengthOf(1);

			const monitor = result[0];
			expect(monitor).to.have.property("_id", "monitor1");
			expect(monitor).to.have.property("name", "Test Monitor");

			// Check uptime percentages exist for all time periods
			expect(monitor).to.have.property("1");
			expect(monitor).to.have.property("7");
			expect(monitor).to.have.property("30");
			expect(monitor).to.have.property("90");

			// Verify uptime percentage calculation (3 successful out of 4 = 75%)
			expect(monitor["1"]).to.equal(75);
			expect(monitor["7"]).to.equal(75);
			expect(monitor["30"]).to.equal(75);
			expect(monitor["90"]).to.equal(75);
		});

		it("should handle errors appropriately", async function () {
			// Setup stub to throw error
			monitorFindStub.rejects(new Error("Database error"));

			try {
				await getAllMonitorsWithUptimeStats();
			} catch (error) {
				expect(error).to.be.an("error");
				expect(error.message).to.equal("Database error");
				expect(error.service).to.equal("monitorModule");
				expect(error.method).to.equal("getAllMonitorsWithUptimeStats");
			}
		});

		it("should handle empty monitor list", async function () {
			monitorFindStub.resolves([]);

			const result = await getAllMonitorsWithUptimeStats();

			expect(result).to.be.an("array");
			expect(result).to.have.lengthOf(0);
		});

		it("should handle monitor with no checks", async function () {
			const mockMonitors = [
				{
					_id: "monitor1",
					type: "http",
					toObject: () => ({
						_id: "monitor1",
						type: "http",
						name: "Test Monitor",
					}),
				},
			];

			monitorFindStub.resolves(mockMonitors);
			checkFindStub.resolves([]);

			const result = await getAllMonitorsWithUptimeStats();

			expect(result[0]).to.have.property("1", 0);
			expect(result[0]).to.have.property("7", 0);
			expect(result[0]).to.have.property("30", 0);
			expect(result[0]).to.have.property("90", 0);
		});
	});

	describe("calculateUptimeDuration", function () {
		let clock;
		const NOW = new Date("2024-01-01T12:00:00Z").getTime();

		beforeEach(function () {
			// Fix the current time
			clock = sinon.useFakeTimers(NOW);
		});

		afterEach(function () {
			clock.restore();
		});

		it("should return 0 when checks array is empty", function () {
			expect(calculateUptimeDuration([])).to.equal(0);
		});

		it("should return 0 when checks array is null", function () {
			expect(calculateUptimeDuration(null)).to.equal(0);
		});

		it("should calculate uptime from last down check to most recent check", function () {
			const checks = [
				{ status: true, createdAt: "2024-01-01T11:00:00Z" }, // Most recent
				{ status: true, createdAt: "2024-01-01T10:00:00Z" },
				{ status: false, createdAt: "2024-01-01T09:00:00Z" }, // Last down
				{ status: true, createdAt: "2024-01-01T08:00:00Z" },
			];

			// Expected: 2 hours (from 09:00 to 11:00) = 7200000ms
			expect(calculateUptimeDuration(checks)).to.equal(7200000);
		});

		it("should calculate uptime from first check when no down checks exist", function () {
			const checks = [
				{ status: true, createdAt: "2024-01-01T11:00:00Z" },
				{ status: true, createdAt: "2024-01-01T10:00:00Z" },
				{ status: true, createdAt: "2024-01-01T09:00:00Z" },
			];

			// Expected: Current time (12:00) - First check (09:00) = 3 hours = 10800000ms
			expect(calculateUptimeDuration(checks)).to.equal(10800000);
		});
	});

	describe("getLastChecked", function () {
		let clock;
		const NOW = new Date("2024-01-01T12:00:00Z").getTime();

		beforeEach(function () {
			// Fix the current time
			clock = sinon.useFakeTimers(NOW);
		});

		afterEach(function () {
			clock.restore();
		});

		it("should return 0 when checks array is empty", function () {
			expect(getLastChecked([])).to.equal(0);
		});

		it("should return 0 when checks array is null", function () {
			expect(getLastChecked(null)).to.equal(0);
		});

		it("should return time difference between now and most recent check", function () {
			const checks = [
				{ createdAt: "2024-01-01T11:30:00Z" }, // 30 minutes ago
				{ createdAt: "2024-01-01T11:00:00Z" },
				{ createdAt: "2024-01-01T10:30:00Z" },
			];

			// Expected: 30 minutes = 1800000ms
			expect(getLastChecked(checks)).to.equal(1800000);
		});

		it("should handle checks from different days", function () {
			const checks = [
				{ createdAt: "2023-12-31T12:00:00Z" }, // 24 hours ago
				{ createdAt: "2023-12-30T12:00:00Z" },
			];

			// Expected: 24 hours = 86400000ms
			expect(getLastChecked(checks)).to.equal(86400000);
		});
	});

	describe("getLatestResponseTime", function () {
		it("should return 0 when checks array is empty", function () {
			expect(getLatestResponseTime([])).to.equal(0);
		});

		it("should return 0 when checks array is null", function () {
			expect(getLatestResponseTime(null)).to.equal(0);
		});

		it("should return response time from most recent check", function () {
			const checks = [
				{ responseTime: 150, createdAt: "2024-01-01T11:30:00Z" }, // Most recent
				{ responseTime: 200, createdAt: "2024-01-01T11:00:00Z" },
				{ responseTime: 250, createdAt: "2024-01-01T10:30:00Z" },
			];

			expect(getLatestResponseTime(checks)).to.equal(150);
		});

		it("should handle missing responseTime in checks", function () {
			const checks = [
				{ createdAt: "2024-01-01T11:30:00Z" },
				{ responseTime: 200, createdAt: "2024-01-01T11:00:00Z" },
			];

			expect(getLatestResponseTime(checks)).to.equal(0);
		});
	});

	describe("getAverageResponseTime", function () {
		it("should return 0 when checks array is empty", function () {
			expect(getAverageResponseTime([])).to.equal(0);
		});

		it("should return 0 when checks array is null", function () {
			expect(getAverageResponseTime(null)).to.equal(0);
		});

		it("should calculate average response time from all checks", function () {
			const checks = [
				{ responseTime: 100, createdAt: "2024-01-01T11:30:00Z" },
				{ responseTime: 200, createdAt: "2024-01-01T11:00:00Z" },
				{ responseTime: 300, createdAt: "2024-01-01T10:30:00Z" },
			];

			// Average: (100 + 200 + 300) / 3 = 200
			expect(getAverageResponseTime(checks)).to.equal(200);
		});

		it("should handle missing responseTime in some checks", function () {
			const checks = [
				{ responseTime: 100, createdAt: "2024-01-01T11:30:00Z" },
				{ createdAt: "2024-01-01T11:00:00Z" },
				{ responseTime: 300, createdAt: "2024-01-01T10:30:00Z" },
			];

			// Average: (100 + 300) / 2 = 200
			expect(getAverageResponseTime(checks)).to.equal(200);
		});

		it("should return 0 when no checks have responseTime", function () {
			const checks = [
				{ createdAt: "2024-01-01T11:30:00Z" },
				{ createdAt: "2024-01-01T11:00:00Z" },
			];

			expect(getAverageResponseTime(checks)).to.equal(0);
		});
	});

	describe("getUptimePercentage", function () {
		it("should return 0 when checks array is empty", function () {
			expect(getUptimePercentage([])).to.equal(0);
		});

		it("should return 0 when checks array is null", function () {
			expect(getUptimePercentage(null)).to.equal(0);
		});

		it("should return 100 when all checks are up", function () {
			const checks = [{ status: true }, { status: true }, { status: true }];
			expect(getUptimePercentage(checks)).to.equal(100);
		});

		it("should return 0 when all checks are down", function () {
			const checks = [{ status: false }, { status: false }, { status: false }];
			expect(getUptimePercentage(checks)).to.equal(0);
		});

		it("should calculate correct percentage for mixed status checks", function () {
			const checks = [
				{ status: true },
				{ status: false },
				{ status: true },
				{ status: true },
			];
			// 3 up out of 4 total = 75%
			expect(getUptimePercentage(checks)).to.equal(75);
		});

		it("should handle undefined status values", function () {
			const checks = [{ status: true }, { status: undefined }, { status: true }];
			// 2 up out of 3 total ≈ 66.67%
			expect(getUptimePercentage(checks)).to.equal((2 / 3) * 100);
		});
	});

	describe("getIncidents", function () {
		it("should return 0 when checks array is empty", function () {
			expect(getIncidents([])).to.equal(0);
		});

		it("should return 0 when checks array is null", function () {
			expect(getIncidents(null)).to.equal(0);
		});

		it("should return 0 when all checks are up", function () {
			const checks = [{ status: true }, { status: true }, { status: true }];
			expect(getIncidents(checks)).to.equal(0);
		});

		it("should count all incidents when all checks are down", function () {
			const checks = [{ status: false }, { status: false }, { status: false }];
			expect(getIncidents(checks)).to.equal(3);
		});

		it("should count correct number of incidents for mixed status checks", function () {
			const checks = [
				{ status: true },
				{ status: false },
				{ status: true },
				{ status: false },
				{ status: true },
			];
			expect(getIncidents(checks)).to.equal(2);
		});

		it("should handle undefined status values", function () {
			const checks = [
				{ status: true },
				{ status: undefined },
				{ status: false },
				{ status: false },
			];
			// Only counts explicit false values
			expect(getIncidents(checks)).to.equal(2);
		});
	});

	describe("getMonitorChecks", function () {
		let mockModel;

		beforeEach(function () {
			// Create a mock model with chainable methods
			const mockChecks = [
				{ monitorId: "123", createdAt: new Date("2024-01-01") },
				{ monitorId: "123", createdAt: new Date("2024-01-02") },
			];

			mockModel = {
				find: sinon.stub().returns({
					sort: sinon.stub().returns(mockChecks),
				}),
			};
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should return all checks and date-ranged checks", async function () {
			// Arrange
			const monitorId = "123";
			const dateRange = {
				start: new Date("2024-01-01"),
				end: new Date("2024-01-02"),
			};
			const sortOrder = -1;

			// Act
			const result = await getMonitorChecks(monitorId, mockModel, dateRange, sortOrder);

			// Assert
			expect(result).to.have.keys(["checksAll", "checksForDateRange"]);

			// Verify find was called with correct parameters
			expect(mockModel.find.firstCall.args[0]).to.deep.equal({ monitorId });
			expect(mockModel.find.secondCall.args[0]).to.deep.equal({
				monitorId,
				createdAt: { $gte: dateRange.start, $lte: dateRange.end },
			});

			// Verify sort was called with correct parameters
			const sortCalls = mockModel.find().sort.getCalls();
			sortCalls.forEach((call) => {
				expect(call.args[0]).to.deep.equal({ createdAt: sortOrder });
			});
		});

		it("should handle empty results", async function () {
			// Arrange
			const emptyModel = {
				find: sinon.stub().returns({
					sort: sinon.stub().returns([]),
				}),
			};

			// Act
			const result = await getMonitorChecks(
				"123",
				emptyModel,
				{
					start: new Date(),
					end: new Date(),
				},
				-1
			);

			// Assert
			expect(result.checksAll).to.be.an("array").that.is.empty;
			expect(result.checksForDateRange).to.be.an("array").that.is.empty;
		});

		it("should maintain sort order", async function () {
			// Arrange
			const sortedChecks = [
				{ monitorId: "123", createdAt: new Date("2024-01-02") },
				{ monitorId: "123", createdAt: new Date("2024-01-01") },
			];

			const sortedModel = {
				find: sinon.stub().returns({
					sort: sinon.stub().returns(sortedChecks),
				}),
			};

			// Act
			const result = await getMonitorChecks(
				"123",
				sortedModel,
				{
					start: new Date("2024-01-01"),
					end: new Date("2024-01-02"),
				},
				-1
			);

			// Assert
			expect(result.checksAll[0].createdAt).to.be.greaterThan(
				result.checksAll[1].createdAt
			);
			expect(result.checksForDateRange[0].createdAt).to.be.greaterThan(
				result.checksForDateRange[1].createdAt
			);
		});
	});

	describe("processChecksForDisplay", function () {
		let normalizeStub;

		beforeEach(function () {
			normalizeStub = sinon.stub();
		});

		it("should return original checks when numToDisplay is not provided", function () {
			const checks = [1, 2, 3, 4, 5];
			const result = processChecksForDisplay(normalizeStub, checks);
			expect(result).to.deep.equal(checks);
		});

		it("should return original checks when numToDisplay is greater than checks length", function () {
			const checks = [1, 2, 3];
			const result = processChecksForDisplay(normalizeStub, checks, 5);
			expect(result).to.deep.equal(checks);
		});

		it("should filter checks based on numToDisplay", function () {
			const checks = [1, 2, 3, 4, 5, 6];
			const result = processChecksForDisplay(normalizeStub, checks, 3);
			// Should return [1, 3, 5] as n = ceil(6/3) = 2
			expect(result).to.deep.equal([1, 3, 5]);
		});

		it("should handle empty checks array", function () {
			const checks = [];
			const result = processChecksForDisplay(normalizeStub, checks, 3);
			expect(result).to.be.an("array").that.is.empty;
		});

		it("should call normalizeData when normalize is true", function () {
			const checks = [1, 2, 3];
			normalizeStub.returns([10, 20, 30]);

			const result = processChecksForDisplay(normalizeStub, checks, null, true);

			expect(normalizeStub.args[0]).to.deep.equal([checks, 1, 100]);
			expect(result).to.deep.equal([10, 20, 30]);
		});

		it("should handle both filtering and normalization", function () {
			const checks = [1, 2, 3, 4, 5, 6];
			normalizeStub.returns([10, 30, 50]);

			const result = processChecksForDisplay(normalizeStub, checks, 3, true);

			expect(normalizeStub.args[0][0]).to.deep.equal([1, 3, 5]);
			expect(result).to.deep.equal([10, 30, 50]);
		});
	});

	describe("groupChecksByTime", function () {
		const mockChecks = [
			{ createdAt: "2024-01-15T10:30:45Z" },
			{ createdAt: "2024-01-15T10:45:15Z" },
			{ createdAt: "2024-01-15T11:15:00Z" },
			{ createdAt: "2024-01-16T10:30:00Z" },
		];

		it("should group checks by hour when dateRange is 'day'", function () {
			const result = groupChecksByTime(mockChecks, "day");

			// Get timestamps for 10:00 and 11:00 on Jan 15
			const time1 = new Date("2024-01-15T10:00:00Z").getTime();
			const time2 = new Date("2024-01-15T11:00:00Z").getTime();
			const time3 = new Date("2024-01-16T10:00:00Z").getTime();

			expect(Object.keys(result)).to.have.lengthOf(3);

			expect(result[time1].checks).to.have.lengthOf(2);
			expect(result[time2].checks).to.have.lengthOf(1);
			expect(result[time3].checks).to.have.lengthOf(1);
		});

		it("should group checks by day when dateRange is not 'day'", function () {
			const result = groupChecksByTime(mockChecks, "week");

			expect(Object.keys(result)).to.have.lengthOf(2);
			expect(result["2024-01-15"].checks).to.have.lengthOf(3);
			expect(result["2024-01-16"].checks).to.have.lengthOf(1);
		});

		it("should handle empty checks array", function () {
			const result = groupChecksByTime([], "day");
			expect(result).to.deep.equal({});
		});

		it("should handle single check", function () {
			const singleCheck = [{ createdAt: "2024-01-15T10:30:45Z" }];
			const result = groupChecksByTime(singleCheck, "day");

			const expectedTime = new Date("2024-01-15T10:00:00Z").getTime();
			expect(Object.keys(result)).to.have.lengthOf(1);
			expect(result[expectedTime].checks).to.have.lengthOf(1);
		});

		it("should skip invalid dates and process valid ones", function () {
			const checksWithInvalidDate = [
				{ createdAt: "invalid-date" },
				{ createdAt: "2024-01-15T10:30:45Z" },
				{ createdAt: null },
				{ createdAt: undefined },
				{ createdAt: "" },
			];

			const result = groupChecksByTime(checksWithInvalidDate, "day");

			const expectedTime = new Date("2024-01-15T10:00:00Z").getTime();
			expect(Object.keys(result)).to.have.lengthOf(1);
			expect(result[expectedTime].checks).to.have.lengthOf(1);
			expect(result[expectedTime].checks[0].createdAt).to.equal("2024-01-15T10:30:45Z");
		});

		it("should handle checks in same time group", function () {
			const checksInSameHour = [
				{ createdAt: "2024-01-15T10:15:00Z" },
				{ createdAt: "2024-01-15T10:45:00Z" },
			];

			const result = groupChecksByTime(checksInSameHour, "day");

			const expectedTime = new Date("2024-01-15T10:00:00Z").getTime();
			expect(Object.keys(result)).to.have.lengthOf(1);
			expect(result[expectedTime].checks).to.have.lengthOf(2);
		});
	});

	describe("calculateGroupStats", function () {
		// Mock getUptimePercentage function
		let uptimePercentageStub;

		beforeEach(function () {
			uptimePercentageStub = sinon.stub();
			uptimePercentageStub.returns(95); // Default return value
		});

		it("should calculate stats correctly for a group of checks", function () {
			const mockGroup = {
				time: "2024-01-15",
				checks: [
					{ status: true, responseTime: 100 },
					{ status: false, responseTime: 200 },
					{ status: true, responseTime: 300 },
				],
			};

			const result = calculateGroupStats(mockGroup, uptimePercentageStub);

			expect(result).to.deep.equal({
				time: "2024-01-15",
				uptimePercentage: (2 / 3) * 100,
				totalChecks: 3,
				totalIncidents: 1,
				avgResponseTime: 200, // (100 + 200 + 300) / 3
			});
		});

		it("should handle empty checks array", function () {
			const mockGroup = {
				time: "2024-01-15",
				checks: [],
			};

			const result = calculateGroupStats(mockGroup, uptimePercentageStub);

			expect(result).to.deep.equal({
				time: "2024-01-15",
				uptimePercentage: 0,
				totalChecks: 0,
				totalIncidents: 0,
				avgResponseTime: 0,
			});
		});

		it("should handle missing responseTime values", function () {
			const mockGroup = {
				time: "2024-01-15",
				checks: [
					{ status: true },
					{ status: false, responseTime: 200 },
					{ status: true, responseTime: undefined },
				],
			};

			const result = calculateGroupStats(mockGroup, uptimePercentageStub);

			expect(result).to.deep.equal({
				time: "2024-01-15",
				uptimePercentage: (2 / 3) * 100,
				totalChecks: 3,
				totalIncidents: 1,
				avgResponseTime: 200, // 200 / 1
			});
		});

		it("should handle all checks with status false", function () {
			const mockGroup = {
				time: "2024-01-15",
				checks: [
					{ status: false, responseTime: 100 },
					{ status: false, responseTime: 200 },
					{ status: false, responseTime: 300 },
				],
			};

			const result = calculateGroupStats(mockGroup, uptimePercentageStub);

			expect(result).to.deep.equal({
				time: "2024-01-15",
				uptimePercentage: 0,
				totalChecks: 3,
				totalIncidents: 3,
				avgResponseTime: 200,
			});
		});

		it("should handle all checks with status true", function () {
			const mockGroup = {
				time: "2024-01-15",
				checks: [
					{ status: true, responseTime: 100 },
					{ status: true, responseTime: 200 },
					{ status: true, responseTime: 300 },
				],
			};

			const result = calculateGroupStats(mockGroup, uptimePercentageStub);

			expect(result).to.deep.equal({
				time: "2024-01-15",
				uptimePercentage: 100,
				totalChecks: 3,
				totalIncidents: 0,
				avgResponseTime: 200,
			});
		});
	});

	describe("getMonitorStatsById", function () {
		const now = new Date();
		const oneHourAgo = new Date(now - 3600000);
		const twoHoursAgo = new Date(now - 7200000);

		const mockMonitor = {
			_id: "monitor123",
			type: "http",
			name: "Test Monitor",
			url: "https://test.com",
			toObject: () => ({
				_id: "monitor123",
				type: "http",
				name: "Test Monitor",
				url: "https://test.com",
			}),
		};

		const mockMonitorPing = {
			_id: "monitor123",
			type: "ping",
			name: "Test Monitor",
			url: "https://test.com",
			toObject: () => ({
				_id: "monitor123",
				type: "http",
				name: "Test Monitor",
				url: "https://test.com",
			}),
		};
		const mockMonitorDocker = {
			_id: "monitor123",
			type: "docker",
			name: "Test Monitor",
			url: "https://test.com",
			toObject: () => ({
				_id: "monitor123",
				type: "http",
				name: "Test Monitor",
				url: "https://test.com",
			}),
		};

		const checkDocs = [
			{
				monitorId: "monitor123",
				status: true,
				responseTime: 100,
				createdAt: new Date("2024-01-01T12:00:00Z"),
				toObject: function () {
					return {
						monitorId: this.monitorId,
						status: this.status,
						responseTime: this.responseTime,
						createdAt: this.createdAt,
					};
				},
			},
			{
				monitorId: "monitor123",
				status: true,
				responseTime: 150,
				createdAt: new Date("2024-01-01T11:00:00Z"),
				toObject: function () {
					return {
						monitorId: this.monitorId,
						status: this.status,
						responseTime: this.responseTime,
						createdAt: this.createdAt,
					};
				},
			},
			{
				monitorId: "monitor123",
				status: false,
				responseTime: 200,
				createdAt: new Date("2024-01-01T10:00:00Z"),
				toObject: function () {
					return {
						monitorId: this.monitorId,
						status: this.status,
						responseTime: this.responseTime,
						createdAt: this.createdAt,
					};
				},
			},
		];
		const req = {
			params: { monitorId: "monitor123" },
			query: {
				dateRange: "day",
				sortOrder: "desc",
				numToDisplay: 10,
				normalize: true,
			},
		};

		beforeEach(function () {
			checkFindStub.returns({
				sort: () => checkDocs,
			});
			monitorFindByIdStub.returns(mockMonitor);
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should return monitor stats with calculated values, sort order desc", async function () {
			req.query.sortOrder = "desc";
			const result = await getMonitorStatsById(req);
			expect(result).to.include.keys([
				"_id",
				"type",
				"name",
				"url",
				"uptimeDuration",
				"lastChecked",
				"latestResponseTime",
				"periodIncidents",
				"periodTotalChecks",
				"periodAvgResponseTime",
				"periodUptime",
				"aggregateData",
			]);
			expect(result.latestResponseTime).to.equal(100);
			expect(result.periodTotalChecks).to.equal(3);
			expect(result.periodIncidents).to.equal(1);
			expect(result.periodUptime).to.be.a("number");
			expect(result.aggregateData).to.be.an("array");
		});

		it("should return monitor stats with calculated values, ping type", async function () {
			monitorFindByIdStub.returns(mockMonitorPing);
			req.query.sortOrder = "desc";
			const result = await getMonitorStatsById(req);
			expect(result).to.include.keys([
				"_id",
				"type",
				"name",
				"url",
				"uptimeDuration",
				"lastChecked",
				"latestResponseTime",
				"periodIncidents",
				"periodTotalChecks",
				"periodAvgResponseTime",
				"periodUptime",
				"aggregateData",
			]);
			expect(result.latestResponseTime).to.equal(100);
			expect(result.periodTotalChecks).to.equal(3);
			expect(result.periodIncidents).to.equal(1);
			expect(result.periodUptime).to.be.a("number");
			expect(result.aggregateData).to.be.an("array");
		});

		it("should return monitor stats with calculated values, docker type", async function () {
			monitorFindByIdStub.returns(mockMonitorDocker);
			req.query.sortOrder = "desc";
			const result = await getMonitorStatsById(req);
			expect(result).to.include.keys([
				"_id",
				"type",
				"name",
				"url",
				"uptimeDuration",
				"lastChecked",
				"latestResponseTime",
				"periodIncidents",
				"periodTotalChecks",
				"periodAvgResponseTime",
				"periodUptime",
				"aggregateData",
			]);
			expect(result.latestResponseTime).to.equal(100);
			expect(result.periodTotalChecks).to.equal(3);
			expect(result.periodIncidents).to.equal(1);
			expect(result.periodUptime).to.be.a("number");
			expect(result.aggregateData).to.be.an("array");
		});

		it("should return monitor stats with calculated values", async function () {
			req.query.sortOrder = "asc";
			const result = await getMonitorStatsById(req);
			expect(result).to.include.keys([
				"_id",
				"type",
				"name",
				"url",
				"uptimeDuration",
				"lastChecked",
				"latestResponseTime",
				"periodIncidents",
				"periodTotalChecks",
				"periodAvgResponseTime",
				"periodUptime",
				"aggregateData",
			]);
			expect(result.latestResponseTime).to.equal(100);
			expect(result.periodTotalChecks).to.equal(3);
			expect(result.periodIncidents).to.equal(1);
			expect(result.periodUptime).to.be.a("number");
			expect(result.aggregateData).to.be.an("array");
		});

		it("should throw error when monitor is not found", async function () {
			monitorFindByIdStub.returns(Promise.resolve(null));

			const req = {
				params: { monitorId: "nonexistent" },
			};

			try {
				await getMonitorStatsById(req);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error).to.be.an("Error");
				expect(error.service).to.equal("monitorModule");
				expect(error.method).to.equal("getMonitorStatsById");
			}
		});
	});

	describe("getMonitorById", function () {
		let notificationFindStub;
		let monitorSaveStub;

		beforeEach(function () {
			// Create stubs
			notificationFindStub = sinon.stub(Notification, "find");
			monitorSaveStub = sinon.stub().resolves();
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should return monitor with notifications when found", async function () {
			// Arrange
			const monitorId = "123";
			const mockMonitor = {
				_id: monitorId,
				name: "Test Monitor",
				save: monitorSaveStub,
			};
			const mockNotifications = [
				{ _id: "notif1", message: "Test notification 1" },
				{ _id: "notif2", message: "Test notification 2" },
			];

			monitorFindByIdStub.resolves(mockMonitor);
			notificationFindStub.resolves(mockNotifications);

			const result = await getMonitorById(monitorId);
			expect(result._id).to.equal(monitorId);
			expect(result.name).to.equal("Test Monitor");
			expect(monitorFindByIdStub.calledWith(monitorId)).to.be.true;
			expect(notificationFindStub.calledWith({ monitorId })).to.be.true;
			expect(monitorSaveStub.calledOnce).to.be.true;
		});

		it("should throw 404 error when monitor not found", async function () {
			// Arrange
			const monitorId = "nonexistent";
			monitorFindByIdStub.resolves(null);

			// Act & Assert
			try {
				await getMonitorById(monitorId);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error.message).to.equal(errorMessages.DB_FIND_MONITOR_BY_ID(monitorId));
				expect(error.status).to.equal(404);
				expect(error.service).to.equal("monitorModule");
				expect(error.method).to.equal("getMonitorById");
			}
		});

		it("should handle database errors properly", async function () {
			// Arrange
			const monitorId = "123";
			const dbError = new Error("Database connection failed");
			monitorFindByIdStub.rejects(dbError);

			// Act & Assert
			try {
				await getMonitorById(monitorId);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error.service).to.equal("monitorModule");
				expect(error.method).to.equal("getMonitorById");
				expect(error.message).to.equal("Database connection failed");
			}
		});

		it("should handle notification fetch errors", async function () {
			// Arrange
			const monitorId = "123";
			const mockMonitor = {
				_id: monitorId,
				name: "Test Monitor",
				save: monitorSaveStub,
			};
			const notificationError = new Error("Notification fetch failed");

			monitorFindByIdStub.resolves(mockMonitor);
			notificationFindStub.rejects(notificationError);

			// Act & Assert
			try {
				await getMonitorById(monitorId);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error.service).to.equal("monitorModule");
				expect(error.method).to.equal("getMonitorById");
				expect(error.message).to.equal("Notification fetch failed");
			}
		});

		it("should handle monitor save errors", async function () {
			// Arrange
			const monitorId = "123";
			const mockMonitor = {
				_id: monitorId,
				name: "Test Monitor",
				save: sinon.stub().rejects(new Error("Save failed")),
			};
			const mockNotifications = [];

			monitorFindByIdStub.resolves(mockMonitor);
			notificationFindStub.resolves(mockNotifications);

			// Act & Assert
			try {
				await getMonitorById(monitorId);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error.service).to.equal("monitorModule");
				expect(error.method).to.equal("getMonitorById");
				expect(error.message).to.equal("Save failed");
			}
		});
	});

	describe("getMonitorsAndSummaryByTeamId", function () {
		it("should return monitors and correct summary counts", async function () {
			// Arrange
			const teamId = "team123";
			const type = "http";
			const mockMonitors = [
				{ teamId, type, status: true, isActive: true }, // up
				{ teamId, type, status: false, isActive: true }, // down
				{ teamId, type, status: null, isActive: false }, // paused
				{ teamId, type, status: true, isActive: true }, // up
			];
			monitorFindStub.resolves(mockMonitors);

			// Act
			const result = await getMonitorsAndSummaryByTeamId(teamId, type);

			// Assert
			expect(result.monitors).to.have.lengthOf(4);
			expect(result.monitorCounts).to.deep.equal({
				up: 2,
				down: 1,
				paused: 1,
				total: 4,
			});
			expect(monitorFindStub.calledOnceWith({ teamId, type })).to.be.true;
		});

		it("should return empty results for non-existent team", async function () {
			// Arrange
			monitorFindStub.resolves([]);

			// Act
			const result = await getMonitorsAndSummaryByTeamId("nonexistent", "http");

			// Assert
			expect(result.monitors).to.have.lengthOf(0);
			expect(result.monitorCounts).to.deep.equal({
				up: 0,
				down: 0,
				paused: 0,
				total: 0,
			});
		});

		it("should handle database errors", async function () {
			// Arrange
			const error = new Error("Database error");
			error.service = "MonitorModule";
			error.method = "getMonitorsAndSummaryByTeamId";
			monitorFindStub.rejects(error);

			// Act & Assert
			try {
				await getMonitorsAndSummaryByTeamId("team123", "http");
				expect.fail("Should have thrown an error");
			} catch (err) {
				expect(err).to.equal(error);
				expect(err.service).to.equal("monitorModule");
				expect(err.method).to.equal("getMonitorsAndSummaryByTeamId");
			}
		});
	});

	describe("getMonitorsByTeamId", function () {
		beforeEach(function () {
			// Chain stubs for Monitor.find().skip().limit().sort()

			// Stub for CHECK_MODEL_LOOKUP model find
			checkFindStub.returns({
				sort: sinon.stub().returns({
					limit: sinon.stub().returns([]),
				}),
			});
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should return monitors with basic query parameters", async function () {
			const mockMonitors = [
				{ _id: "1", type: "http", toObject: () => ({ _id: "1", type: "http" }) },
				{ _id: "2", type: "ping", toObject: () => ({ _id: "2", type: "ping" }) },
			];
			monitorFindStub.returns({
				skip: sinon.stub().returns({
					limit: sinon.stub().returns({
						sort: sinon.stub().returns(mockMonitors),
					}),
				}),
			});

			const req = {
				params: { teamId: "team123" },
				query: {
					type: "http",
					page: 0,
					rowsPerPage: 10,
					field: "name",
					status: false,
					checkOrder: "desc",
				},
			};

			monitorCountStub.resolves(2);

			const result = await getMonitorsByTeamId(req);

			expect(result).to.have.property("monitors");
			expect(result).to.have.property("monitorCount", 2);
		});

		it("should return monitors with basic query parameters", async function () {
			const mockMonitors = [
				{ _id: "1", type: "http", toObject: () => ({ _id: "1", type: "http" }) },
				{ _id: "2", type: "ping", toObject: () => ({ _id: "2", type: "ping" }) },
			];
			monitorFindStub.returns({
				skip: sinon.stub().returns({
					limit: sinon.stub().returns({
						sort: sinon.stub().returns(mockMonitors),
					}),
				}),
			});

			const req = {
				params: { teamId: "team123" },
				query: {
					type: "http",
					page: 0,
					rowsPerPage: 10,
					field: "name",
					status: true,
					checkOrder: "asc",
				},
			};

			monitorCountStub.resolves(2);

			const result = await getMonitorsByTeamId(req);

			expect(result).to.have.property("monitors");
			expect(result).to.have.property("monitorCount", 2);
		});

		it("should handle type filter with array input", async function () {
			const req = {
				params: { teamId: "team123" },
				query: {
					type: ["http", "ping"],
				},
			};

			monitorFindStub.returns({
				skip: sinon.stub().returns({
					limit: sinon.stub().returns({
						sort: sinon.stub().returns([]),
					}),
				}),
			});
			monitorCountStub.resolves(0);

			await getMonitorsByTeamId(req);

			expect(Monitor.find.firstCall.args[0]).to.deep.equal({
				teamId: "team123",
				type: { $in: ["http", "ping"] },
			});
		});

		it("should handle text search filter", async function () {
			const req = {
				params: { teamId: "team123" },
				query: {
					filter: "search",
				},
			};

			monitorFindStub.returns({
				skip: sinon.stub().returns({
					limit: sinon.stub().returns({
						sort: sinon.stub().returns([]),
					}),
				}),
			});
			monitorCountStub.resolves(0);

			await getMonitorsByTeamId(req);

			expect(Monitor.find.firstCall.args[0]).to.deep.equal({
				teamId: "team123",
				$or: [
					{ name: { $regex: "search", $options: "i" } },
					{ url: { $regex: "search", $options: "i" } },
				],
			});
		});

		it("should handle pagination parameters", async function () {
			const req = {
				params: { teamId: "team123" },
				query: {
					page: 2,
					rowsPerPage: 5,
				},
			};

			monitorFindStub.returns({
				skip: sinon.stub().returns({
					limit: sinon.stub().returns({
						sort: sinon.stub().returns([]),
					}),
				}),
			});
			monitorCountStub.resolves(0);

			const result = await getMonitorsByTeamId(req);
			expect(result).to.deep.equal({
				monitors: [],
				monitorCount: 0,
			});
		});

		it("should handle sorting parameters", async function () {
			const req = {
				params: { teamId: "team123" },
				query: {
					field: "name",
					order: "asc",
				},
			};

			monitorFindStub.returns({
				skip: sinon.stub().returns({
					limit: sinon.stub().returns({
						sort: sinon.stub().returns([]),
					}),
				}),
			});
			monitorCountStub.resolves(0);

			await getMonitorsByTeamId(req);

			const result = await getMonitorsByTeamId(req);
			expect(result).to.deep.equal({
				monitors: [],
				monitorCount: 0,
			});
		});

		it("should return early when limit is -1", async function () {
			// Arrange
			const req = {
				params: { teamId: "team123" },
				query: {
					limit: "-1",
				},
			};

			const mockMonitors = [
				{ _id: "1", type: "http" },
				{ _id: "2", type: "ping" },
			];

			monitorFindStub.returns({
				skip: sinon.stub().returns({
					limit: sinon.stub().returns({
						sort: sinon.stub().returns(mockMonitors),
					}),
				}),
			});

			monitorCountStub.resolves(2);

			// Act
			const result = await getMonitorsByTeamId(req);

			// Assert
			expect(result).to.deep.equal({
				monitors: mockMonitors,
				monitorCount: 2,
			});
		});

		it("should normalize checks when normalize parameter is provided", async function () {
			const req = {
				params: { teamId: "team123" },
				query: { normalize: "true" },
			};
			monitorCountStub.resolves(2);

			const mockMonitors = [
				{ _id: "1", type: "http", toObject: () => ({ _id: "1", type: "http" }) },
				{ _id: "2", type: "ping", toObject: () => ({ _id: "2", type: "ping" }) },
			];

			monitorFindStub.returns({
				skip: sinon.stub().returns({
					limit: sinon.stub().returns({
						sort: sinon.stub().returns(mockMonitors),
					}),
				}),
			});

			const result = await getMonitorsByTeamId(req);
			expect(result.monitorCount).to.equal(2);
			expect(result.monitors).to.have.lengthOf(2);
		});

		it("should handle database errors", async function () {
			const req = {
				params: { teamId: "team123" },
				query: {},
			};

			const error = new Error("Database error");
			monitorFindStub.returns({
				skip: sinon.stub().returns({
					limit: sinon.stub().returns({
						sort: sinon.stub().throws(error),
					}),
				}),
			});

			try {
				await getMonitorsByTeamId(req);
				expect.fail("Should have thrown an error");
			} catch (err) {
				expect(err.service).to.equal("monitorModule");
				expect(err.method).to.equal("getMonitorsByTeamId");
				expect(err.message).to.equal("Database error");
			}
		});
	});

	describe("createMonitor", function () {
		it("should create a monitor without notifications", async function () {
			let monitorSaveStub = sinon.stub(Monitor.prototype, "save").resolves();

			const req = {
				body: {
					name: "Test Monitor",
					url: "http://test.com",
					type: "http",
					notifications: ["someNotification"],
				},
			};

			const expectedMonitor = {
				name: "Test Monitor",
				url: "http://test.com",
				type: "http",
				notifications: undefined,
				save: monitorSaveStub,
			};

			const result = await createMonitor(req);
			expect(result.name).to.equal(expectedMonitor.name);
			expect(result.url).to.equal(expectedMonitor.url);
		});

		it("should handle database errors", async function () {
			const req = {
				body: {
					name: "Test Monitor",
				},
			};

			try {
				await createMonitor(req);
				expect.fail("Should have thrown an error");
			} catch (err) {
				expect(err.service).to.equal("monitorModule");
				expect(err.method).to.equal("createMonitor");
			}
		});
	});

	describe("deleteMonitor", function () {
		it("should delete a monitor successfully", async function () {
			const monitorId = "123456789";
			const mockMonitor = {
				_id: monitorId,
				name: "Test Monitor",
				url: "http://test.com",
			};

			const req = {
				params: { monitorId },
			};

			monitorFindByIdAndDeleteStub.resolves(mockMonitor);

			const result = await deleteMonitor(req);

			expect(result).to.deep.equal(mockMonitor);
			sinon.assert.calledWith(monitorFindByIdAndDeleteStub, monitorId);
		});

		it("should throw error when monitor not found", async function () {
			const monitorId = "nonexistent123";
			const req = {
				params: { monitorId },
			};

			monitorFindByIdAndDeleteStub.resolves(null);

			try {
				await deleteMonitor(req);
				expect.fail("Should have thrown an error");
			} catch (err) {
				expect(err.message).to.equal(errorMessages.DB_FIND_MONITOR_BY_ID(monitorId));
				expect(err.service).to.equal("monitorModule");
				expect(err.method).to.equal("deleteMonitor");
			}
		});

		it("should handle database errors", async function () {
			const monitorId = "123456789";
			const req = {
				params: { monitorId },
			};

			const dbError = new Error("Database connection error");
			monitorFindByIdAndDeleteStub.rejects(dbError);

			try {
				await deleteMonitor(req);
				expect.fail("Should have thrown an error");
			} catch (err) {
				expect(err.message).to.equal("Database connection error");
				expect(err.service).to.equal("monitorModule");
				expect(err.method).to.equal("deleteMonitor");
			}
		});
	});

	describe("deleteAllMonitors", function () {
		it("should delete all monitors for a team successfully", async function () {
			const teamId = "team123";
			const mockMonitors = [
				{ _id: "1", name: "Monitor 1", teamId },
				{ _id: "2", name: "Monitor 2", teamId },
			];

			monitorFindStub.resolves(mockMonitors);
			monitorDeleteManyStub.resolves({ deletedCount: 2 });

			const result = await deleteAllMonitors(teamId);

			expect(result).to.deep.equal({
				monitors: mockMonitors,
				deletedCount: 2,
			});
			sinon.assert.calledWith(monitorFindStub, { teamId });
			sinon.assert.calledWith(monitorDeleteManyStub, { teamId });
		});

		it("should return empty array when no monitors found", async function () {
			const teamId = "emptyTeam";

			monitorFindStub.resolves([]);
			monitorDeleteManyStub.resolves({ deletedCount: 0 });

			const result = await deleteAllMonitors(teamId);

			expect(result).to.deep.equal({
				monitors: [],
				deletedCount: 0,
			});
			sinon.assert.calledWith(monitorFindStub, { teamId });
			sinon.assert.calledWith(monitorDeleteManyStub, { teamId });
		});

		it("should handle database errors", async function () {
			const teamId = "team123";
			const dbError = new Error("Database connection error");
			monitorFindStub.rejects(dbError);

			try {
				await deleteAllMonitors(teamId);
			} catch (err) {
				expect(err.message).to.equal("Database connection error");
				expect(err.service).to.equal("monitorModule");
				expect(err.method).to.equal("deleteAllMonitors");
			}
		});

		it("should handle deleteMany errors", async function () {
			const teamId = "team123";
			monitorFindStub.resolves([{ _id: "1", name: "Monitor 1" }]);
			monitorDeleteManyStub.rejects(new Error("Delete operation failed"));

			try {
				await deleteAllMonitors(teamId);
			} catch (err) {
				expect(err.message).to.equal("Delete operation failed");
				expect(err.service).to.equal("monitorModule");
				expect(err.method).to.equal("deleteAllMonitors");
			}
		});
	});

	describe("deleteMonitorsByUserId", function () {
		beforeEach(function () {});

		afterEach(function () {
			sinon.restore();
		});

		it("should delete all monitors for a user successfully", async function () {
			// Arrange
			const userId = "user123";
			const mockResult = {
				deletedCount: 3,
				acknowledged: true,
			};

			monitorDeleteManyStub.resolves(mockResult);

			// Act
			const result = await deleteMonitorsByUserId(userId);

			// Assert
			expect(result).to.deep.equal(mockResult);
			sinon.assert.calledWith(monitorDeleteManyStub, { userId: userId });
		});

		it("should return zero deletedCount when no monitors found", async function () {
			// Arrange
			const userId = "nonexistentUser";
			const mockResult = {
				deletedCount: 0,
				acknowledged: true,
			};

			monitorDeleteManyStub.resolves(mockResult);

			// Act
			const result = await deleteMonitorsByUserId(userId);

			// Assert
			expect(result.deletedCount).to.equal(0);
			sinon.assert.calledWith(monitorDeleteManyStub, { userId: userId });
		});

		it("should handle database errors", async function () {
			// Arrange
			const userId = "user123";
			const dbError = new Error("Database connection error");
			monitorDeleteManyStub.rejects(dbError);

			// Act & Assert
			try {
				await deleteMonitorsByUserId(userId);
				expect.fail("Should have thrown an error");
			} catch (err) {
				expect(err.message).to.equal("Database connection error");
				expect(err.service).to.equal("monitorModule");
				expect(err.method).to.equal("deleteMonitorsByUserId");
			}
		});
	});

	describe("editMonitor", function () {
		it("should edit a monitor successfully", async function () {
			// Arrange
			const candidateId = "monitor123";
			const candidateMonitor = {
				name: "Updated Monitor",
				url: "http://updated.com",
				type: "http",
				notifications: ["someNotification"],
			};

			const expectedUpdateData = {
				name: "Updated Monitor",
				url: "http://updated.com",
				type: "http",
				notifications: undefined,
			};

			const mockUpdatedMonitor = {
				_id: candidateId,
				...expectedUpdateData,
			};

			monitorFindByIdAndUpdateStub.resolves(mockUpdatedMonitor);

			// Act
			const result = await editMonitor(candidateId, candidateMonitor);

			// Assert
			expect(result).to.deep.equal(mockUpdatedMonitor);
			sinon.assert.calledWith(
				monitorFindByIdAndUpdateStub,
				candidateId,
				expectedUpdateData,
				{
					new: true,
				}
			);
		});

		it("should return null when monitor not found", async function () {
			// Arrange
			const candidateId = "nonexistent123";
			const candidateMonitor = {
				name: "Updated Monitor",
			};

			monitorFindByIdAndUpdateStub.resolves(null);

			// Act
			const result = await editMonitor(candidateId, candidateMonitor);

			// Assert
			expect(result).to.be.null;
			sinon.assert.calledWith(
				monitorFindByIdAndUpdateStub,
				candidateId,
				{ name: "Updated Monitor", notifications: undefined },
				{ new: true }
			);
		});

		it("should remove notifications from update data", async function () {
			// Arrange
			const candidateId = "monitor123";
			const candidateMonitor = {
				name: "Updated Monitor",
				notifications: ["notification1", "notification2"],
			};

			const expectedUpdateData = {
				name: "Updated Monitor",
				notifications: undefined,
			};

			monitorFindByIdAndUpdateStub.resolves({
				_id: candidateId,
				...expectedUpdateData,
			});

			// Act
			await editMonitor(candidateId, candidateMonitor);

			// Assert
			sinon.assert.calledWith(
				monitorFindByIdAndUpdateStub,
				candidateId,
				expectedUpdateData,
				{
					new: true,
				}
			);
		});

		it("should handle database errors", async function () {
			// Arrange
			const candidateId = "monitor123";
			const candidateMonitor = {
				name: "Updated Monitor",
			};

			const dbError = new Error("Database connection error");
			monitorFindByIdAndUpdateStub.rejects(dbError);

			// Act & Assert
			try {
				await editMonitor(candidateId, candidateMonitor);
				expect.fail("Should have thrown an error");
			} catch (err) {
				expect(err.message).to.equal("Database connection error");
				expect(err.service).to.equal("monitorModule");
				expect(err.method).to.equal("editMonitor");
			}
		});
	});

	describe("addDemoMonitors", function () {
		it("should add demo monitors successfully", async function () {
			// Arrange
			const userId = "user123";
			const teamId = "team123";
			monitorInsertManyStub.resolves([{ _id: "123" }]);
			const result = await addDemoMonitors(userId, teamId);
			expect(result).to.deep.equal([{ _id: "123" }]);
		});

		it("should handle database errors", async function () {
			const userId = "user123";
			const teamId = "team123";

			const dbError = new Error("Database connection error");
			monitorInsertManyStub.rejects(dbError);

			try {
				await addDemoMonitors(userId, teamId);
			} catch (err) {
				expect(err.message).to.equal("Database connection error");
				expect(err.service).to.equal("monitorModule");
				expect(err.method).to.equal("addDemoMonitors");
			}
		});
	});
});
