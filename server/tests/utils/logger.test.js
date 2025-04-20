import sinon from "sinon";
import logger from "../../utils/logger.js";
import { Logger } from "../../utils/logger.js";
import winston from "winston";

describe("Logger", function () {
	let infoStub, warnStub, errorStub;

	beforeEach(function () {
		infoStub = sinon.stub(logger.logger, "info");
		warnStub = sinon.stub(logger.logger, "warn");
		errorStub = sinon.stub(logger.logger, "error");
	});

	afterEach(function () {
		sinon.restore();
	});

	describe("constructor", function () {
		let createLoggerStub;

		beforeEach(function () {
			createLoggerStub = sinon.stub(winston, "createLogger");
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should convert message to JSON string if it is an object", function () {
			const logMessage = { key: "value" };
			const expectedMessage = JSON.stringify(logMessage, null, 2);

			createLoggerStub.callsFake((config) => {
				const consoleTransport = config.transports[0];
				const logEntry = {
					level: "info",
					message: logMessage,
					timestamp: new Date().toISOString(),
				};
				const formattedMessage = consoleTransport.format.transform(logEntry);
				expect(formattedMessage).to.include(expectedMessage);
				return { log: sinon.spy() };
			});

			const logger = new Logger();
			logger.logger.info(logMessage);
		});

		it("should convert details to JSON string if it is an object", function () {
			const logDetails = { key: "value" };
			const expectedDetails = JSON.stringify(logDetails, null, 2); // Removed .s

			createLoggerStub.callsFake((config) => {
				const consoleTransport = config.transports[0];
				const logEntry = {
					level: "info",
					message: "", // Add empty message since it's required
					details: logDetails,
					timestamp: new Date().toISOString(),
				};
				const formattedMessage = consoleTransport.format.transform(logEntry);
				expect(formattedMessage).to.include(expectedDetails);
				return { info: sinon.spy() }; // Changed to return info method
			});

			const logger = new Logger();
			logger.logger.info("", { details: logDetails }); // Updated to pass details properly
		});
	});

	describe("info", function () {
		it("should log an informational message", function () {
			const config = {
				message: "Info message",
				service: "TestService",
				method: "TestMethod",
				details: { key: "value" },
			};

			logger.info(config);

			expect(infoStub.calledOnce).to.be.true;
			expect(
				infoStub.calledWith(config.message, {
					service: config.service,
					method: config.method,
					details: config.details,
				})
			).to.be.true;
		});
	});

	describe("warn", function () {
		it("should log a warning message", function () {
			const config = {
				message: "Warning message",
				service: "TestService",
				method: "TestMethod",
				details: { key: "value" },
			};

			logger.warn(config);

			expect(warnStub.calledOnce).to.be.true;
			expect(
				warnStub.calledWith(config.message, {
					service: config.service,
					method: config.method,
					details: config.details,
				})
			).to.be.true;
		});
	});

	describe("error", function () {
		it("should log an error message", function () {
			const config = {
				message: "Error message",
				service: "TestService",
				method: "TestMethod",
				details: { key: "value" },
				stack: "Error stack trace",
			};

			logger.error(config);

			expect(errorStub.calledOnce).to.be.true;
			expect(
				errorStub.calledWith(config.message, {
					service: config.service,
					method: config.method,
					details: config.details,
					stack: config.stack,
				})
			).to.be.true;
		});
	});
});
