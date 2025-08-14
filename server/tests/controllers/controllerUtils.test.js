import sinon from "sinon";

import { handleValidationError, handleError, fetchMonitorCertificate } from "../../controllers/controllerUtils.js";
import { expect } from "chai";
import sslChecker from "ssl-checker";
import { afterEach } from "node:test";
import exp from "constants";

describe("controllerUtils - handleValidationError", function () {
	it("should set status to 422", function () {
		const error = {};
		const serviceName = "TestService";
		const result = handleValidationError(error, serviceName);
		expect(result.status).to.equal(422);
	});

	it("should set service to the provided serviceName", function () {
		const error = {};
		const serviceName = "TestService";
		const result = handleValidationError(error, serviceName);
		expect(result.service).to.equal(serviceName);
	});

	it("should set message to error.details[0].message if present", function () {
		const error = {
			details: [{ message: "Detail message" }],
		};
		const serviceName = "TestService";
		const result = handleValidationError(error, serviceName);
		expect(result.message).to.equal("Detail message");
	});

	it("should set message to error.message if error.details is not present", function () {
		const error = {
			message: "Error message",
		};
		const serviceName = "TestService";
		const result = handleValidationError(error, serviceName);
		expect(result.message).to.equal("Error message");
	});

	it('should set message to "Validation Error" if neither error.details nor error.message is present', function () {
		const error = {};
		const serviceName = "TestService";
		const result = handleValidationError(error, serviceName);
		expect(result.message).to.equal("Validation Error");
	});
});

describe("controllerUtils - handleError", function () {
	it("should set stats to the provided status if error.code is undefined", function () {
		const error = {};
		const serviceName = "TestService";
		const method = "testMethod";
		const status = 400;
		const result = handleError(error, serviceName, method, status);
		expect(result.status).to.equal(status);
	});

	it("should not overwrite error.code if it is already defined", function () {
		const error = { status: 404 };
		const serviceName = "TestService";
		const method = "testMethod";
		const status = 400;
		const result = handleError(error, serviceName, method, status);
		expect(result.status).to.equal(404);
	});

	it("should set service to the provided serviceName if error.service is undefined", function () {
		const error = {};
		const serviceName = "TestService";
		const method = "testMethod";
		const result = handleError(error, serviceName, method);
		expect(result.service).to.equal(serviceName);
	});

	it("should not overwrite error.service if it is already defined", function () {
		const error = { service: "ExistingService" };
		const serviceName = "TestService";
		const method = "testMethod";
		const result = handleError(error, serviceName, method);
		expect(result.service).to.equal("ExistingService");
	});

	it("should set method to the provided method if error.method is undefined", function () {
		const error = {};
		const serviceName = "TestService";
		const method = "testMethod";
		const result = handleError(error, serviceName, method);
		expect(result.method).to.equal(method);
	});

	it("should not overwrite error.method if it is already defined", function () {
		const error = { method: "existingMethod" };
		const serviceName = "TestService";
		const method = "testMethod";
		const result = handleError(error, serviceName, method);
		expect(result.method).to.equal("existingMethod");
	});

	it("should set code to 500 if error.code is undefined and no code is provided", function () {
		const error = {};
		const serviceName = "TestService";
		const method = "testMethod";
		const result = handleError(error, serviceName, method);
		expect(result.status).to.equal(500);
	});
});

describe("controllerUtils - fetchMonitorCertificate", function () {
	let sslChecker, monitor;

	beforeEach(function () {
		monitor = {
			url: "https://www.google.com",
		};
		sslChecker = sinon.stub();
	});

	afterEach(() => {
		sinon.restore();
	});

	it("should reject with an error if a URL does not parse", async function () {
		monitor.url = "invalidurl";
		try {
			await fetchMonitorCertificate(sslChecker, monitor);
		} catch (error) {
			expect(error).to.be.an("error");
			expect(error.message).to.equal("Invalid URL");
		}
	});

	it("should reject with an error if sslChecker throws an error", async function () {
		sslChecker.rejects(new Error("Test error"));
		try {
			await fetchMonitorCertificate(sslChecker, monitor);
		} catch (error) {
			expect(error).to.be.an("error");
			expect(error.message).to.equal("Test error");
		}
	});

	it("should return a certificate if sslChecker resolves", async function () {
		sslChecker.resolves({ validTo: "2022-01-01" });
		const result = await fetchMonitorCertificate(sslChecker, monitor);
		expect(result).to.deep.equal({ validTo: "2022-01-01" });
	});

	it("should throw an error if a ssl-checker returns null", async function () {
		sslChecker.returns(null);
		await fetchMonitorCertificate(sslChecker, monitor).catch((error) => {
			expect(error).to.be.an("error");
			expect(error.message).to.equal("Certificate not found");
		});
	});
});
