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

			const containers = await docker.listContainers({ all: true });
			const containerExists = containers.some((c) => c.Id.startsWith(monitor.url));
			if (!containerExists) {
				throw new Error(this.stringService.dockerNotFound);
			}

			const container = docker.getContainer(monitor.url);
			const { response, responseTime, error } = await this.timeRequest(() => container.inspect());

			const dockerResponse = {
				monitorId: monitor._id,
				type: monitor.type,
				responseTime,
				status: response?.State?.Status === "running" ? true : false,
				code: 200,
				message: "Docker container status fetched successfully",
			};

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

	async requestNtfy(url, message, title, notification) {
		try {
			// Build headers
			const headers = {
				Title: title,
				Priority: notification.ntfyPriority?.toString() || "3",
				Tags: "checkmate,monitoring",
				"Content-Type": "text/plain",
			};

			// Add authentication headers based on method
			if (notification.ntfyAuthMethod === "username_password" && notification.ntfyUsername && notification.ntfyPassword) {
				const auth = Buffer.from(`${notification.ntfyUsername}:${notification.ntfyPassword}`).toString("base64");
				headers["Authorization"] = `Basic ${auth}`;
			} else if (notification.ntfyAuthMethod === "bearer_token" && notification.ntfyBearerToken) {
				headers["Authorization"] = `Bearer ${notification.ntfyBearerToken}`;
			}

			// Send the notification
			const response = await this.axios.post(url, message, { headers });

			return {
				type: "ntfy",
				status: true,
				code: response.status,
				message: "Successfully sent ntfy notification",
				payload: response.data,
			};
		} catch (error) {
			this.logger.warn({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "requestNtfy",
				url: url,
			});

			return {
				type: "ntfy",
				status: false,
				code: error.response?.status || this.NETWORK_ERROR,
				message: `Failed to send ntfy notification: ${error.message}`,
				payload: error.response?.data,
			};
		}
	}
}

export default NetworkService;
