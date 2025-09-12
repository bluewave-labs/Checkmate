import { match } from "assert";

const SERVICE_NAME = "NetworkService";

class NetworkService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor({ axios, got, https, jmespath, GameDig, ping, logger, http, Docker, net, stringService, settingsService }) {
		this.TYPE_PING = "ping";
		this.TYPE_HTTP = "http";
		this.TYPE_PAGESPEED = "pagespeed";
		this.TYPE_HARDWARE = "hardware";
		this.TYPE_DOCKER = "docker";
		this.TYPE_PORT = "port";
		this.TYPE_GAME = "game";
		this.SERVICE_NAME = SERVICE_NAME;
		this.NETWORK_ERROR = 5000;
		this.PING_ERROR = 5001;
		this.axios = axios;
		this.got = got;
		this.https = https;
		this.jmespath = jmespath;
		this.GameDig = GameDig;
		this.ping = ping;
		this.logger = logger;
		this.http = http;
		this.Docker = Docker;
		this.net = net;
		this.stringService = stringService;
		this.settingsService = settingsService;
	}

	// Helper functions
	async timeRequest(operation) {
		const start = process.hrtime.bigint();
		try {
			const response = await operation();
			const elapsedMs = Math.round(Number(process.hrtime.bigint() - start) / 1_000_000);
			return { response, responseTime: elapsedMs };
		} catch (error) {
			const elapsedMs = Math.round(Number(process.hrtime.bigint() - start) / 1_000_000);
			return { response: null, responseTime: elapsedMs, error };
		}
	}

	// Main entry point
	async requestStatus(monitor) {
		const type = monitor?.type || "unknown";
		switch (type) {
			case this.TYPE_PING:
				return await this.requestPing(monitor);
			case this.TYPE_HTTP:
				return await this.requestHttp(monitor);
			case this.TYPE_PAGESPEED:
				return await this.requestPageSpeed(monitor);
			case this.TYPE_HARDWARE:
				return await this.requestHardware(monitor);
			case this.TYPE_DOCKER:
				return await this.requestDocker(monitor);
			case this.TYPE_PORT:
				return await this.requestPort(monitor);
			case this.TYPE_GAME:
				return await this.requestGame(monitor);
			default:
				return await this.handleUnsupportedType(type);
		}
	}

	async requestPing(monitor) {
		try {
			if (!monitor?.url) {
				throw new Error("Monitor URL is required");
			}

			const { response, responseTime, error } = await this.timeRequest(() => this.ping.promise.probe(monitor.url));

			if (!response) {
				if (error) {
					throw error;
				}
				throw new Error("Ping failed - no result returned");
			}

			const pingResponse = {
				monitorId: monitor._id,
				type: "ping",
				status: response.alive,
				code: 200,
				responseTime,
				message: "Success",
				payload: response,
			};

			if (error) {
				pingResponse.status = false;
				pingResponse.code = 200;
				pingResponse.message = "Ping failed";
				return pingResponse;
			}

			return pingResponse;
		} catch (err) {
			err.service = this.SERVICE_NAME;
			err.method = "requestPing";
			throw err;
		}
	}

	async requestHttp(monitor) {
		const { url, secret, _id, name, teamId, type, ignoreTlsErrors, jsonPath, matchMethod, expectedValue } = monitor;
		const httpResponse = {
			monitorId: _id,
			teamId: teamId,
			type,
		};

		try {
			if (!url) {
				throw new Error("Monitor URL is required");
			}
			const config = {
				headers: secret ? { Authorization: `Bearer ${secret}` } : undefined,
			};

			if (ignoreTlsErrors) {
				config.agent = {
					https: new this.https.Agent({
						rejectUnauthorized: false,
					}),
				};
			}

			const response = await this.got(url, config);

			let payload;
			const contentType = response.headers["content-type"];

			if (contentType && contentType.includes("application/json")) {
				try {
					payload = JSON.parse(response.body);
				} catch {
					payload = response.body;
				}
			} else {
				payload = response.body;
			}

			httpResponse.code = response.statusCode;
			httpResponse.status = response.ok;
			httpResponse.message = response.statusMessage;
			httpResponse.responseTime = response.timings.phases.total || 0;
			httpResponse.payload = payload;
			httpResponse.timings = response.timings || {};

			if (!expectedValue && !jsonPath) {
				return httpResponse;
			}

			if (expectedValue) {
				let ok = false;
				if (matchMethod === "equal") ok = payload === expectedValue;
				if (matchMethod === "include") ok = payload.includes(expectedValue);
				if (matchMethod === "regex") ok = new RegExp(expectedValue).test(payload);

				if (ok === true) {
					return httpResponse;
				} else {
					httpResponse.code = 500;
					httpResponse.status = false;
					return httpResponse;
				}
			}

			if (jsonPath) {
				const contentType = response.headers["content-type"];

				const isJson = contentType?.includes("application/json");
				if (!isJson) {
					httpResponse.status = false;
					httpResponse.message = this.stringService.httpNotJson;
					return httpResponse;
				}

				try {
					this.jmespath.search(payload, jsonPath);
				} catch {
					httpResponse.status = false;
					httpResponse.message = this.stringService.httpJsonPathError;
					return httpResponse;
				}
			}
			return httpResponse;
		} catch (err) {
			if (err.name === "HTTPError" || err.name === "RequestError") {
				httpResponse.code = err?.response?.statusCode || this.NETWORK_ERROR;
				httpResponse.status = false;
				httpResponse.message = err?.response?.statusCode || err.message;
				httpResponse.responseTime = err?.timings?.phases?.total || 0;
				httpResponse.payload = null;
				httpResponse.timings = err?.timings || {};
				return httpResponse;
			}
			err.service = this.SERVICE_NAME;
			err.method = "requestHttp";
			throw err;
		}
	}

	async requestPageSpeed(monitor) {
		try {
			const url = monitor.url;
			if (!url) {
				throw new Error("Monitor URL is required");
			}
			let pageSpeedUrl = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&category=seo&category=accessibility&category=best-practices&category=performance`;
			const dbSettings = await this.settingsService.getDBSettings();
			if (dbSettings?.pagespeedApiKey) {
				pageSpeedUrl += `&key=${dbSettings.pagespeedApiKey}`;
			} else {
				this.logger.warn({
					message: "PageSpeed API key not found, job not executed",
					service: this.SERVICE_NAME,
					method: "requestPagespeed",
					details: { url },
				});
			}
			return await this.requestHttp({
				...monitor,
				url: pageSpeedUrl,
			});
		} catch (err) {
			err.service = this.SERVICE_NAME;
			err.method = "requestPageSpeed";
			throw err;
		}
	}

	async requestHardware(monitor) {
		try {
			return await this.requestHttp(monitor);
		} catch (err) {
			err.service = this.SERVICE_NAME;
			err.method = "requestHardware";
			throw err;
		}
	}

	async requestDocker(monitor) {
		try {
			if (!monitor.url) {
				throw new Error("Monitor URL is required");
			}

			const docker = new this.Docker({
				socketPath: "/var/run/docker.sock",
				handleError: true, // Enable error handling
			});

			const dockerResponse = {
				monitorId: monitor._id,
				type: monitor.type,
			};

			const containers = await docker.listContainers({ all: true });

			// Normalize input: strip leading slashes and convert to lowercase for comparison
			const normalizedInput = monitor.url.replace(/^\/+/, "").toLowerCase();

			// Priority-based matching to avoid ambiguity:
			// 1. Exact full ID match (64-char)
			let exactIdMatch = containers.find((c) => c.Id.toLowerCase() === normalizedInput);

			// 2. Exact container name match (case-insensitive)
			let exactNameMatch = containers.find((c) =>
				c.Names.some((name) => {
					const cleanName = name.replace(/^\/+/, "").toLowerCase();
					return cleanName === normalizedInput;
				})
			);

			// 3. Partial ID match (fallback for backwards compatibility)
			let partialIdMatch = containers.find((c) => c.Id.toLowerCase().startsWith(normalizedInput));

			// Select container based on priority
			let targetContainer = exactIdMatch || exactNameMatch || partialIdMatch;

			// Return negative response if no container
			if (!targetContainer) {
				this.logger.warn({
					message: `No container found for "${monitor.url}".`,
					service: this.SERVICE_NAME,
					method: "requestDocker",
					details: { url: monitor.url },
				});

				dockerResponse.code = 404;
				dockerResponse.status = false;
				dockerResponse.message = this.stringService.dockerNotFound;
				return dockerResponse;
			}

			// Return negative response if ambiguous matches exist
			const matchTypes = [];
			if (exactIdMatch) matchTypes.push("exact ID");
			if (exactNameMatch) matchTypes.push("exact name");
			if (partialIdMatch && !exactIdMatch) matchTypes.push("partial ID");

			if (matchTypes.length > 1) {
				this.logger.warn({
					message: `Ambiguous container match for "${monitor.url}". Matched by: ${matchTypes.join(", ")}. Using ${exactIdMatch ? "exact ID" : exactNameMatch ? "exact name" : "partial ID"} match.`,
					service: this.SERVICE_NAME,
					method: "requestDocker",
					details: { url: monitor.url },
				});
				dockerResponse.status = 404;
				dockerResponse.status = false;
				dockerResponse.message = `Ambiguous container match for "${monitor.url}". Matched by: ${matchTypes.join(", ")}. Using ${exactIdMatch ? "exact ID" : exactNameMatch ? "exact name" : "partial ID"} match.`;
				return dockerResponse;
			}

			const container = docker.getContainer(targetContainer.Id);
			const { response, responseTime, error } = await this.timeRequest(() => container.inspect());

			dockerResponse.responseTime = responseTime;
			dockerResponse.status = response?.State?.Status === "running" ? true : false;
			dockerResponse.code = 200;
			dockerResponse.message = "Docker container status fetched successfully";

			if (error) {
				dockerResponse.status = false;
				dockerResponse.code = error.statusCode || this.NETWORK_ERROR;
				dockerResponse.message = error.reason || "Failed to fetch Docker container information";
				return dockerResponse;
			}

			return dockerResponse;
		} catch (err) {
			err.service = this.SERVICE_NAME;
			err.method = "requestDocker";
			throw err;
		}
	}

	async requestPort(monitor) {
		try {
			const { url, port } = monitor;
			const { response, responseTime, error } = await this.timeRequest(async () => {
				return new Promise((resolve, reject) => {
					const socket = this.net.createConnection(
						{
							host: url,
							port,
						},
						() => {
							socket.end();
							socket.destroy();
							resolve({ success: true });
						}
					);

					socket.setTimeout(5000);
					socket.on("timeout", () => {
						socket.destroy();
						reject(new Error("Connection timeout"));
					});

					socket.on("error", (err) => {
						socket.destroy();
						reject(err);
					});
				});
			});

			const portResponse = {
				code: 200,
				status: response.success,
				message: this.stringService.portSuccess,
				monitorId: monitor._id,
				type: monitor.type,
				responseTime,
			};

			if (error) {
				portResponse.code = this.NETWORK_ERROR;
				portResponse.status = false;
				portResponse.message = this.stringService.portFail;
				return portResponse;
			}

			return portResponse;
		} catch (error) {
			error.service = this.SERVICE_NAME;
			error.method = "requestTCP";
			throw error;
		}
	}

	async requestGame(monitor) {
		try {
			const { url, port, gameId } = monitor;

			const gameResponse = {
				code: 200,
				status: true,
				message: "Success",
				monitorId: monitor._id,
				type: "game",
			};

			const state = await this.GameDig.query({
				type: gameId,
				host: url,
				port: port,
			}).catch((error) => {
				this.logger.warn({
					message: error.message,
					service: this.SERVICE_NAME,
					method: "requestGame",
					details: { url, port, gameId },
				});
			});

			if (!state) {
				gameResponse.code = this.NETWORK_ERROR;
				gameResponse.status = false;
				gameResponse.message = "No response";
				return gameResponse;
			}

			gameResponse.responseTime = state.ping;
			gameResponse.payload = state;
			return gameResponse;
		} catch (error) {
			error.service = this.SERVICE_NAME;
			error.method = "requestPing";
			throw error;
		}
	}
	async handleUnsupportedType(type) {
		const err = new Error(`Unsupported type: ${type}`);
		err.service = this.SERVICE_NAME;
		err.method = "getStatus";
		throw err;
	}

	// Other network requests unrelated to monitoring:
	async requestWebhook(type, url, body) {
		try {
			const response = await this.axios.post(url, body, {
				headers: {
					"Content-Type": "application/json",
				},
			});

			return {
				type: "webhook",
				status: true,
				code: response.status,
				message: `Successfully sent ${type} notification`,
				payload: response.data,
			};
		} catch (error) {
			this.logger.warn({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "requestWebhook",
			});

			return {
				type: "webhook",
				status: false,
				code: error.response?.status || this.NETWORK_ERROR,
				message: `Failed to send ${type} notification`,
				payload: error.response?.data,
			};
		}
	}

	async requestPagerDuty({ message, routingKey, monitorUrl }) {
		try {
			const response = await this.axios.post(`https://events.pagerduty.com/v2/enqueue`, {
				routing_key: routingKey,
				event_action: "trigger",
				payload: {
					summary: message,
					severity: "critical",
					source: monitorUrl,
					timestamp: new Date().toISOString(),
				},
			});

			if (response?.data?.status !== "success") return false;
			return true;
		} catch (error) {
			error.details = error.response?.data;
			error.service = this.SERVICE_NAME;
			error.method = "requestPagerDuty";
			throw error;
		}
	}
}

export default NetworkService;
