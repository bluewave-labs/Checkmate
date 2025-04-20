import sinon from "sinon";
import NetworkService from "../../service/networkService.js";
import { expect } from "chai";
import http from "http";
import { errorMessages } from "../../utils/messages.js";
describe("Network Service", function () {
	let axios, ping, Docker, logger, networkService;

	beforeEach(function () {
		axios = {
			get: sinon.stub().resolves({
				data: { foo: "bar" },
				status: 200,
			}),
		};
		Docker = class {
			listContainers = sinon.stub().resolves([
				{
					Names: ["http://test.com"],
					Id: "http://test.com",
				},
			]);
			getContainer = sinon.stub().returns({
				inspect: sinon.stub().resolves({ State: { Status: "running" } }),
			});
		};
		ping = {
			promise: {
				probe: sinon
					.stub()
					.resolves({ response: { alive: true }, responseTime: 100, alive: true }),
			},
		};
		logger = { error: sinon.stub() };
		networkService = new NetworkService(axios, ping, logger, http, Docker);
	});

	describe("constructor", function () {
		it("should create a new NetworkService instance", function () {
			const networkService = new NetworkService();
			expect(networkService).to.be.an.instanceOf(NetworkService);
		});
	});

	describe("timeRequest", function () {
		it("should time an asynchronous operation", async function () {
			const operation = sinon.stub().resolves("success");
			const { response, responseTime } = await networkService.timeRequest(operation);
			expect(response).to.equal("success");
			expect(responseTime).to.be.a("number");
		});

		it("should handle errors if operation throws error", async function () {
			const error = new Error("Test error");
			const operation = sinon.stub().throws(error);
			const { response, responseTime } = await networkService.timeRequest(operation);
			expect(response).to.be.null;
			expect(responseTime).to.be.a("number");
			expect(error.message).to.equal("Test error");
		});
	});

	describe("requestPing", function () {
		it("should return a response object if ping successful", async function () {
			const pingResult = await networkService.requestPing({
				data: { url: "http://test.com", _id: "123" },
			});
			expect(pingResult.monitorId).to.equal("123");
			expect(pingResult.type).to.equal("ping");
			expect(pingResult.responseTime).to.be.a("number");
			expect(pingResult.status).to.be.true;
		});

		it("should return a response object if ping unsuccessful", async function () {
			const error = new Error("Test error");
			networkService.timeRequest = sinon
				.stub()
				.resolves({ response: null, responseTime: 1, error });
			const pingResult = await networkService.requestPing({
				data: { url: "http://test.com", _id: "123" },
			});
			expect(pingResult.monitorId).to.equal("123");
			expect(pingResult.type).to.equal("ping");
			expect(pingResult.responseTime).to.be.a("number");
			expect(pingResult.status).to.be.false;
			expect(pingResult.code).to.equal(networkService.PING_ERROR);
		});

		it("should throw an error if ping cannot resolve", async function () {
			const error = new Error("test error");
			networkService.timeRequest = sinon.stub().throws(error);
			try {
				await networkService.requestPing({
					data: { url: "http://test.com", _id: "123" },
				});
			} catch (error) {
				expect(error).to.exist;
				expect(error.method).to.equal("requestPing");
			}
		});
	});

	describe("requestHttp", function () {
		it("should return a response object if http successful", async function () {
			const job = { data: { url: "http://test.com", _id: "123", type: "http" } };
			const httpResult = await networkService.requestHttp(job);
			expect(httpResult.monitorId).to.equal("123");
			expect(httpResult.type).to.equal("http");
			expect(httpResult.responseTime).to.be.a("number");
			expect(httpResult.status).to.be.true;
		});

		it("should return a response object if http unsuccessful", async function () {
			const error = new Error("Test error");
			error.response = { status: 404 };
			networkService.timeRequest = sinon
				.stub()
				.resolves({ response: null, responseTime: 1, error });
			const job = { data: { url: "http://test.com", _id: "123", type: "http" } };
			const httpResult = await networkService.requestHttp(job);
			expect(httpResult.monitorId).to.equal("123");
			expect(httpResult.type).to.equal("http");
			expect(httpResult.responseTime).to.be.a("number");
			expect(httpResult.status).to.be.false;
			expect(httpResult.code).to.equal(404);
		});

		it("should return a response object if http unsuccessful with unknown code", async function () {
			const error = new Error("Test error");
			error.response = {};
			networkService.timeRequest = sinon
				.stub()
				.resolves({ response: null, responseTime: 1, error });
			const job = { data: { url: "http://test.com", _id: "123", type: "http" } };
			const httpResult = await networkService.requestHttp(job);
			expect(httpResult.monitorId).to.equal("123");
			expect(httpResult.type).to.equal("http");
			expect(httpResult.responseTime).to.be.a("number");
			expect(httpResult.status).to.be.false;
			expect(httpResult.code).to.equal(networkService.NETWORK_ERROR);
		});

		it("should throw an error if an error occurs", async function () {
			const error = new Error("test error");
			networkService.timeRequest = sinon.stub().throws(error);
			try {
				await networkService.requestHttp({
					data: { url: "http://test.com", _id: "123" },
				});
			} catch (error) {
				expect(error).to.exist;
				expect(error.method).to.equal("requestHttp");
			}
		});
	});

	describe("requestPagespeed", function () {
		it("should return a response object if pagespeed successful", async function () {
			const job = { data: { url: "http://test.com", _id: "123", type: "pagespeed" } };
			const pagespeedResult = await networkService.requestPagespeed(job);
			expect(pagespeedResult.monitorId).to.equal("123");
			expect(pagespeedResult.type).to.equal("pagespeed");
			expect(pagespeedResult.responseTime).to.be.a("number");
			expect(pagespeedResult.status).to.be.true;
		});

		it("should return a response object if pagespeed unsuccessful", async function () {
			const error = new Error("Test error");
			error.response = { status: 404 };
			networkService.timeRequest = sinon
				.stub()
				.resolves({ response: null, responseTime: 1, error });
			const job = { data: { url: "http://test.com", _id: "123", type: "pagespeed" } };
			const pagespeedResult = await networkService.requestPagespeed(job);
			expect(pagespeedResult.monitorId).to.equal("123");
			expect(pagespeedResult.type).to.equal("pagespeed");
			expect(pagespeedResult.responseTime).to.be.a("number");
			expect(pagespeedResult.status).to.be.false;
			expect(pagespeedResult.code).to.equal(404);
		});

		it("should return a response object if pagespeed unsuccessful with an unknown code", async function () {
			const error = new Error("Test error");
			error.response = {};
			networkService.timeRequest = sinon
				.stub()
				.resolves({ response: null, responseTime: 1, error });
			const job = { data: { url: "http://test.com", _id: "123", type: "pagespeed" } };
			const pagespeedResult = await networkService.requestPagespeed(job);
			expect(pagespeedResult.monitorId).to.equal("123");
			expect(pagespeedResult.type).to.equal("pagespeed");
			expect(pagespeedResult.responseTime).to.be.a("number");
			expect(pagespeedResult.status).to.be.false;
			expect(pagespeedResult.code).to.equal(networkService.NETWORK_ERROR);
		});

		it("should throw an error if pagespeed cannot resolve", async function () {
			const error = new Error("test error");
			networkService.timeRequest = sinon.stub().throws(error);
			try {
				await networkService.requestPagespeed({
					data: { url: "http://test.com", _id: "123" },
				});
			} catch (error) {
				expect(error).to.exist;
				expect(error.method).to.equal("requestPagespeed");
			}
		});
	});

	describe("requestHardware", function () {
		it("should return a response object if hardware successful", async function () {
			const job = { data: { url: "http://test.com", _id: "123", type: "hardware" } };
			const httpResult = await networkService.requestHardware(job);
			expect(httpResult.monitorId).to.equal("123");
			expect(httpResult.type).to.equal("hardware");
			expect(httpResult.responseTime).to.be.a("number");
			expect(httpResult.status).to.be.true;
		});

		it("should return a response object if hardware successful and job has a secret", async function () {
			const job = {
				data: {
					url: "http://test.com",
					_id: "123",
					type: "hardware",
					secret: "my_secret",
				},
			};
			const httpResult = await networkService.requestHardware(job);
			expect(httpResult.monitorId).to.equal("123");
			expect(httpResult.type).to.equal("hardware");
			expect(httpResult.responseTime).to.be.a("number");
			expect(httpResult.status).to.be.true;
		});

		it("should return a response object if hardware unsuccessful", async function () {
			const error = new Error("Test error");
			error.response = { status: 404 };
			networkService.timeRequest = sinon
				.stub()
				.resolves({ response: null, responseTime: 1, error });
			const job = { data: { url: "http://test.com", _id: "123", type: "hardware" } };
			const httpResult = await networkService.requestHardware(job);
			expect(httpResult.monitorId).to.equal("123");
			expect(httpResult.type).to.equal("hardware");
			expect(httpResult.responseTime).to.be.a("number");
			expect(httpResult.status).to.be.false;
			expect(httpResult.code).to.equal(404);
		});

		it("should return a response object if hardware unsuccessful with unknown code", async function () {
			const error = new Error("Test error");
			error.response = {};
			networkService.timeRequest = sinon
				.stub()
				.resolves({ response: null, responseTime: 1, error });
			const job = { data: { url: "http://test.com", _id: "123", type: "hardware" } };
			const httpResult = await networkService.requestHardware(job);
			expect(httpResult.monitorId).to.equal("123");
			expect(httpResult.type).to.equal("hardware");
			expect(httpResult.responseTime).to.be.a("number");
			expect(httpResult.status).to.be.false;
			expect(httpResult.code).to.equal(networkService.NETWORK_ERROR);
		});

		it("should throw an error if hardware cannot resolve", async function () {
			const error = new Error("test error");
			networkService.timeRequest = sinon.stub().throws(error);
			try {
				await networkService.requestHardware({
					data: { url: "http://test.com", _id: "123" },
				});
			} catch (error) {
				expect(error).to.exist;
				expect(error.method).to.equal("requestHardware");
			}
		});
	});

	describe("requestDocker", function () {
		it("should return a response object if docker successful", async function () {
			const job = { data: { url: "http://test.com", _id: "123", type: "docker" } };
			const dockerResult = await networkService.requestDocker(job);
			expect(dockerResult.monitorId).to.equal("123");
			expect(dockerResult.type).to.equal("docker");
			expect(dockerResult.responseTime).to.be.a("number");
			expect(dockerResult.status).to.be.true;
		});

		it("should return a response object with status false if container not running", async function () {
			Docker = class {
				listContainers = sinon.stub().resolves([
					{
						Names: ["/my_container"],
						Id: "abc123",
					},
				]);
				getContainer = sinon.stub().returns({
					inspect: sinon.stub().resolves({ State: { Status: "stopped" } }),
				});
			};
			networkService = new NetworkService(axios, ping, logger, http, Docker);
			const job = { data: { url: "abc123", _id: "123", type: "docker" } };
			const dockerResult = await networkService.requestDocker(job);
			expect(dockerResult.status).to.be.false;
			expect(dockerResult.code).to.equal(200);
		});

		it("should handle an error when fetching the container", async function () {
			Docker = class {
				listContainers = sinon.stub().resolves([
					{
						Names: ["/my_container"],
						Id: "abc123",
					},
				]);
				getContainer = sinon.stub().returns({
					inspect: sinon.stub().throws(new Error("test error")),
				});
			};
			networkService = new NetworkService(axios, ping, logger, http, Docker);
			const job = { data: { url: "abc123", _id: "123", type: "docker" } };
			const dockerResult = await networkService.requestDocker(job);
			expect(dockerResult.status).to.be.false;
			expect(dockerResult.code).to.equal(networkService.NETWORK_ERROR);
		});

		it("should throw an error if operations fail", async function () {
			Docker = class {
				listContainers = sinon.stub().resolves([
					{
						Names: ["/my_container"],
						Id: "abc123",
					},
				]);
				getContainer = sinon.stub().throws(new Error("test error"));
			};
			networkService = new NetworkService(axios, ping, logger, http, Docker);
			const job = { data: { url: "abc123", _id: "123", type: "docker" } };
			try {
				await networkService.requestDocker(job);
			} catch (error) {
				expect(error.message).to.equal("test error");
			}
		});

		it("should throw an error if no matching images found", async function () {
			Docker = class {
				listContainers = sinon.stub().resolves([]);
				getContainer = sinon.stub().throws(new Error("test error"));
			};
			networkService = new NetworkService(axios, ping, logger, http, Docker);
			const job = { data: { url: "abc123", _id: "123", type: "docker" } };
			try {
				await networkService.requestDocker(job);
			} catch (error) {
				expect(error.message).to.equal(errorMessages.DOCKER_NOT_FOUND);
			}
		});
	});

	describe("getStatus", function () {
		beforeEach(function () {
			networkService.requestPing = sinon.stub();
			networkService.requestHttp = sinon.stub();
			networkService.requestPagespeed = sinon.stub();
			networkService.requestHardware = sinon.stub();
			networkService.requestDocker = sinon.stub();
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should call requestPing if type is ping", async function () {
			await networkService.getStatus({ data: { type: "ping" } });
			expect(networkService.requestPing.calledOnce).to.be.true;
			expect(networkService.requestDocker.notCalled).to.be.true;
			expect(networkService.requestHttp.notCalled).to.be.true;
			expect(networkService.requestPagespeed.notCalled).to.be.true;
		});

		it("should call requestHttp if type is http", async function () {
			await networkService.getStatus({ data: { type: "http" } });
			expect(networkService.requestPing.notCalled).to.be.true;
			expect(networkService.requestDocker.notCalled).to.be.true;
			expect(networkService.requestHttp.calledOnce).to.be.true;
			expect(networkService.requestPagespeed.notCalled).to.be.true;
		});

		it("should call requestPagespeed if type is pagespeed", async function () {
			await networkService.getStatus({ data: { type: "pagespeed" } });
			expect(networkService.requestPing.notCalled).to.be.true;
			expect(networkService.requestDocker.notCalled).to.be.true;
			expect(networkService.requestHttp.notCalled).to.be.true;
			expect(networkService.requestPagespeed.calledOnce).to.be.true;
		});

		it("should call requestHardware if type is hardware", async function () {
			await networkService.getStatus({ data: { type: "hardware" } });
			expect(networkService.requestHardware.calledOnce).to.be.true;
			expect(networkService.requestDocker.notCalled).to.be.true;
			expect(networkService.requestPing.notCalled).to.be.true;
			expect(networkService.requestPagespeed.notCalled).to.be.true;
		});

		it("should call requestDocker if type is Docker", async function () {
			await networkService.getStatus({ data: { type: "docker" } });
			expect(networkService.requestDocker.calledOnce).to.be.true;
			expect(networkService.requestHardware.notCalled).to.be.true;
			expect(networkService.requestPing.notCalled).to.be.true;
			expect(networkService.requestPagespeed.notCalled).to.be.true;
		});

		it("should throw an error if an unknown type is provided", async function () {
			try {
				await networkService.getStatus({ data: { type: "unknown" } });
			} catch (error) {
				expect(error.service).to.equal("NetworkService");
				expect(error.method).to.equal("getStatus");
				expect(error.message).to.equal("Unsupported type: unknown");
			}
		});

		it("should throw an error if job type is undefined", async function () {
			try {
				await networkService.getStatus({ data: { type: undefined } });
			} catch (error) {
				expect(error.service).to.equal("NetworkService");
				expect(error.method).to.equal("getStatus");
				expect(error.message).to.equal("Unsupported type: unknown");
			}
		});

		it("should throw an error if job is empty", async function () {
			try {
				await networkService.getStatus({});
			} catch (error) {
				expect(error.method).to.equal("getStatus");
				expect(error.message).to.equal("Unsupported type: unknown");
			}
		});

		it("should throw an error if job is null", async function () {
			try {
				await networkService.getStatus(null);
			} catch (error) {
				expect(error.service).to.equal("NetworkService");
				expect(error.method).to.equal("getStatus");
				expect(error.message).to.equal("Unsupported type: unknown");
			}
		});
	});
});
