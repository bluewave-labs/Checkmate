import jmespath from "jmespath";
import https from "https";

const SERVICE_NAME = "NetworkService";
const UPROCK_ENDPOINT = "https://api.uprock.com/checkmate/push";

/**
 * Constructs a new NetworkService instance.
 *
 * @param {Object} axios - The axios instance for HTTP requests.
 * @param {Object} ping - The ping utility for network checks.
 * @param {Object} logger - The logger instance for logging.
 * @param {Object} http - The HTTP utility for network operations.
 * @param {Object} net - The net utility for network operations.
 */
class NetworkService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(axios, ping, logger, http, Docker, net, stringService, settingsService) {
		this.TYPE_PING = "ping";
		this.TYPE_HTTP = "http";
		this.TYPE_PAGESPEED = "pagespeed";
		this.TYPE_HARDWARE = "hardware";
		this.TYPE_DOCKER = "docker";
		this.TYPE_PORT = "port";
		this.SERVICE_NAME = SERVICE_NAME;
		this.NETWORK_ERROR = 5000;
		this.PING_ERROR = 5001;
		this.axios = axios;
		this.ping = ping;
		this.logger = logger;
		this.http = http;
		this.Docker = Docker;
		this.net = net;
		this.stringService = stringService;
		this.settingsService = settingsService;
	}

	get serviceName() {
		return NetworkService.SERVICE_NAME;
	}

	/**
	 * Times the execution of an asynchronous operation.
	 *
	 * @param {Function} operation - The asynchronous operation to be timed.
	 * @returns {Promise<Object>} An object containing the response, response time, and optionally an error.
	 * @property {Object|null} response - The response from the operation, or null if an error occurred.
	 * @property {number} responseTime - The time taken for the operation to complete, in milliseconds.
	 * @property {Error} [error] - The error object if an error occurred during the operation.
	 */
	async timeRequest(operation) {
		const startTime = Date.now();
		try {
			const response = await operation();
			const endTime = Date.now();
			const responseTime = endTime - startTime;
			return { response, responseTime };
		} catch (error) {
			const endTime = Date.now();
			const responseTime = endTime - startTime;
			return { response: null, responseTime, error };
		}
	}

	/**
	 * Performs a ping check to a specified host to verify its availability.
	 * @async
	 * @param {Object} monitor - The monitor configuration object
	 * @param {string} monitor.url - The host URL to ping
	 * @param {string} monitor._id - The unique identifier of the monitor
	 * @returns {Promise<Object>} A promise that resolves to a ping response object
	 * @returns {string} pingResponse.monitorId - The ID of the monitor
	 * @returns {string} pingResponse.type - The type of monitor (always "ping")
	 * @returns {number} pingResponse.responseTime - The time taken for the ping
	 * @returns {Object} pingResponse.payload - The raw ping response data
	 * @returns {boolean} pingResponse.status - Whether the host is alive (true) or not (false)
	 * @returns {number} pingResponse.code - Status code (200 for success, PING_ERROR for failure)
	 * @returns {string} pingResponse.message - Success or failure message
	 * @throws {Error} If there's an error during the ping operation
	 */
	async requestPing(monitor) {
		try {
			const url = monitor.url;
			const { response, responseTime, error } = await this.timeRequest(() => this.ping.promise.probe(url));

			const pingResponse = {
				monitorId: monitor._id,
				type: "ping",
				responseTime,
				payload: response,
			};
			if (error) {
				pingResponse.status = false;
				pingResponse.code = this.PING_ERROR;
				pingResponse.message = "No response";
				return pingResponse;
			}

			pingResponse.code = 200;
			pingResponse.status = response.alive;
			pingResponse.message = "Success";
			return pingResponse;
		} catch (error) {
			error.service = this.SERVICE_NAME;
			error.method = "requestPing";
			throw error;
		}
	}

	/**
	 * Performs an HTTP GET request to a specified URL with optional validation of response data.
	 * @async
	 * @param {Object} monitor - The monitor configuration object
	 * @param {string} monitor.url - The URL to make the HTTP request to
	 * @param {string} [monitor.secret] - Optional Bearer token for authentication
	 * @param {string} monitor._id - The unique identifier of the monitor
	 * @param {string} monitor.name - The name of the monitor
	 * @param {string} monitor.teamId - The team ID associated with the monitor
	 * @param {string} monitor.type - The type of monitor
	 * @param {boolean} [monitor.ignoreTlsErrors] - Whether to ignore TLS certificate errors
	 * @param {string} [monitor.jsonPath] - Optional JMESPath expression to extract data from JSON response
	 * @param {string} [monitor.matchMethod] - Method to match response data ('include', 'regex', or exact match)
	 * @param {string} [monitor.expectedValue] - Expected value to match against response data
	 * @returns {Promise<Object>} A promise that resolves to an HTTP response object
	 * @returns {string} httpResponse.monitorId - The ID of the monitor
	 * @returns {string} httpResponse.teamId - The team ID
	 * @returns {string} httpResponse.type - The type of monitor
	 * @returns {number} httpResponse.responseTime - The time taken for the request
	 * @returns {Object} httpResponse.payload - The response data
	 * @returns {boolean} httpResponse.status - Whether the request was successful and matched expected value (if specified)
	 * @returns {number} httpResponse.code - HTTP status code or NETWORK_ERROR
	 * @returns {string} httpResponse.message - Success or failure message
	 * @throws {Error} If there's an error during the HTTP request or data validation
	 */
	async requestHttp(monitor) {
		try {
			const { url, secret, _id, name, teamId, type, ignoreTlsErrors, jsonPath, matchMethod, expectedValue } = monitor;
			const config = {};

			secret !== undefined && (config.headers = { Authorization: `Bearer ${secret}` });

			if (ignoreTlsErrors === true) {
				config.httpsAgent = new https.Agent({
					rejectUnauthorized: false,
				});
			}

			const { response, responseTime, error } = await this.timeRequest(() => this.axios.get(url, config));

			const httpResponse = {
				monitorId: _id,
				teamId,
				type,
				responseTime,
				payload: response?.data,
			};

			if (error) {
				const code = error.response?.status || this.NETWORK_ERROR;
				httpResponse.code = code;
				httpResponse.status = false;
				httpResponse.message = this.http.STATUS_CODES[code] || this.stringService.httpNetworkError;
				return httpResponse;
			}

			httpResponse.code = response.status;

			if (!expectedValue) {
				// not configure expected value, return
				httpResponse.status = true;
				httpResponse.message = this.http.STATUS_CODES[response.status];
				return httpResponse;
			}

			// validate if response data match expected value
			let result = response?.data;

			this.logger.info({
				service: this.SERVICE_NAME,
				method: "requestHttp",
				message: `Job: [${name}](${_id}) match result with expected value`,
				details: { expectedValue, result, jsonPath, matchMethod },
			});

			if (jsonPath) {
				const contentType = response.headers["content-type"];

				const isJson = contentType?.includes("application/json");
				if (!isJson) {
					httpResponse.status = false;
					httpResponse.message = this.stringService.httpNotJson;
					return httpResponse;
				}

				try {
					result = jmespath.search(result, jsonPath);
				} catch (error) {
					httpResponse.status = false;
					httpResponse.message = this.stringService.httpJsonPathError;
					return httpResponse;
				}
			}

			if (result === null || result === undefined) {
				httpResponse.status = false;
				httpResponse.message = this.stringService.httpEmptyResult;
				return httpResponse;
			}

			let match;
			result = typeof result === "object" ? JSON.stringify(result) : result.toString();
			if (matchMethod === "include") match = result.includes(expectedValue);
			else if (matchMethod === "regex") match = new RegExp(expectedValue).test(result);
			else match = result === expectedValue;

			httpResponse.status = match;
			httpResponse.message = match ? this.stringService.httpMatchSuccess : this.stringService.httpMatchFail;
			return httpResponse;
		} catch (error) {
			error.service = this.SERVICE_NAME;
			error.method = "requestHttp";
			throw error;
		}
	}

	/**
	 * Checks the performance of a webpage using Google's PageSpeed Insights API.
	 * @async
	 * @param {Object} monitor - The monitor configuration object
	 * @param {string} monitor.url - The URL of the webpage to analyze
	 * @returns {Promise<Object|undefined>} A promise that resolves to a pagespeed response object or undefined if API key is missing
	 * @returns {string} response.monitorId - The ID of the monitor
	 * @returns {string} response.type - The type of monitor
	 * @returns {number} response.responseTime - The time taken for the analysis
	 * @returns {boolean} response.status - Whether the analysis was successful
	 * @returns {number} response.code - HTTP status code from the PageSpeed API
	 * @returns {string} response.message - Success or failure message
	 * @returns {Object} response.payload - The PageSpeed analysis results
	 * @throws {Error} If there's an error during the PageSpeed analysis
	 */
	async requestPagespeed(monitor) {
		try {
			const url = monitor.url;
			const updatedMonitor = { ...monitor };
			let pagespeedUrl = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&category=seo&category=accessibility&category=best-practices&category=performance`;

			const dbSettings = await this.settingsService.getDBSettings();
			if (dbSettings?.pagespeedApiKey) {
				pagespeedUrl += `&key=${dbSettings.pagespeedApiKey}`;
			} else {
				this.logger.warn({
					message: "Pagespeed API key not found, job not executed",
					service: this.SERVICE_NAME,
					method: "requestPagespeed",
					details: { url },
				});
				return;
			}
			updatedMonitor.url = pagespeedUrl;
			return await this.requestHttp(updatedMonitor);
		} catch (error) {
			error.service = this.SERVICE_NAME;
			error.method = "requestPagespeed";
			throw error;
		}
	}

	async requestHardware(monitor) {
		try {
			return await this.requestHttp(monitor);
		} catch (error) {
			error.service = this.SERVICE_NAME;
			error.method = "requestHardware";
			throw error;
		}
	}

	/**
	 * Checks the status of a Docker container by its ID.
	 * @async
	 * @param {Object} monitor - The monitor configuration object
	 * @param {string} monitor.url - The Docker container ID to check
	 * @param {string} monitor._id - The unique identifier of the monitor
	 * @param {string} monitor.type - The type of monitor
	 * @returns {Promise<Object>} A promise that resolves to a docker response object
	 * @returns {string} dockerResponse.monitorId - The ID of the monitor
	 * @returns {string} dockerResponse.type - The type of monitor
	 * @returns {number} dockerResponse.responseTime - The time taken for the container inspection
	 * @returns {boolean} dockerResponse.status - Whether the container is running (true) or not (false)
	 * @returns {number} dockerResponse.code - HTTP-like status code (200 for success, NETWORK_ERROR for failure)
	 * @returns {string} dockerResponse.message - Success or failure message
	 * @throws {Error} If the container is not found or if there's an error inspecting the container
	 */
	async requestDocker(monitor) {
		try {
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
			};

			if (error) {
				dockerResponse.status = false;
				dockerResponse.code = error.statusCode || this.NETWORK_ERROR;
				dockerResponse.message = error.reason || "Failed to fetch Docker container information";
				return dockerResponse;
			}
			dockerResponse.status = response?.State?.Status === "running" ? true : false;
			dockerResponse.code = 200;
			dockerResponse.message = "Docker container status fetched successfully";
			return dockerResponse;
		} catch (error) {
			error.service = this.SERVICE_NAME;
			error.method = "requestDocker";
			throw error;
		}
	}

	/**
	 * Attempts to establish a TCP connection to a specified host and port.
	 * @async
	 * @param {Object} monitor - The monitor configuration object
	 * @param {string} monitor.url - The host URL to connect to
	 * @param {number} monitor.port - The port number to connect to
	 * @param {string} monitor._id - The unique identifier of the monitor
	 * @param {string} monitor.type - The type of monitor
	 * @returns {Promise<Object>} A promise that resolves to a port response object
	 * @returns {string} portResponse.monitorId - The ID of the monitor
	 * @returns {string} portResponse.type - The type of monitor
	 * @returns {number} portResponse.responseTime - The time taken for the connection attempt
	 * @returns {boolean} portResponse.status - Whether the connection was successful
	 * @returns {number} portResponse.code - HTTP-like status code (200 for success, NETWORK_ERROR for failure)
	 * @returns {string} portResponse.message - Success or failure message
	 * @throws {Error} If the connection times out or encounters an error
	 */
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
				monitorId: monitor._id,
				type: monitor.type,
				responseTime,
			};

			if (error) {
				portResponse.status = false;
				portResponse.code = this.NETWORK_ERROR;
				portResponse.message = this.stringService.portFail;
				return portResponse;
			}

			portResponse.status = response.success;
			portResponse.code = 200;
			portResponse.message = this.stringService.portSuccess;
			return portResponse;
		} catch (error) {
			error.service = this.SERVICE_NAME;
			error.method = "requestTCP";
			throw error;
		}
	}

	/**
	 * Handles unsupported job types by throwing an error with details.
	 *
	 * @param {string} type - The unsupported job type that was provided
	 * @throws {Error} An error with service name, method name and unsupported type message
	 */
	handleUnsupportedType(type) {
		const err = new Error(`Unsupported type: ${type}`);
		err.service = this.SERVICE_NAME;
		err.method = "getStatus";
		throw err;
	}

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

	/**
	 * Gets the status of a job based on its type and returns the appropriate response.
	 *
	 * @param {Object} job - The job object containing the data for the status request.
	 * @param {Object} job.data - The data object within the job.
	 * @param {string} job.data.type - The type of the job (e.g., "ping", "http", "pagespeed", "hardware").
	 * @returns {Promise<Object>} The response object from the appropriate request method.
	 * @throws {Error} Throws an error if the job type is unsupported.
	 */
	async getStatus(monitor) {
		const type = monitor.type ?? "unknown";
		switch (type) {
			case this.TYPE_PING:
				return await this.requestPing(monitor);
			case this.TYPE_HTTP:
				return await this.requestHttp(monitor);
			case this.TYPE_PAGESPEED:
				return await this.requestPagespeed(monitor);
			case this.TYPE_HARDWARE:
				return await this.requestHardware(monitor);
			case this.TYPE_DOCKER:
				return await this.requestDocker(monitor);
			case this.TYPE_PORT:
				return await this.requestPort(monitor);
			default:
				return this.handleUnsupportedType(type);
		}
	}
}

export default NetworkService;
