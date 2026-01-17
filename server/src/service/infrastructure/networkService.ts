import { HTTPError, RequestError } from "got";
import type { Got, Response } from "got";
import type { Monitor, MonitorStatusResponse } from "@/types/index.js";

import CacheableLookup from "cacheable-lookup";
const SERVICE_NAME = "NetworkService";

type MonitorStatusResponseOverrides<T> = Partial<Omit<MonitorStatusResponse<T>, "monitorId" | "teamId" | "type">>;

interface BuildStatusResponseArgs<T> {
	monitor: Monitor;
	response?: Response<T> | null;
	error?: Error | RequestError | HTTPError | null;
	payload?: T | null;
	jsonPath?: string;
	matchMethod?: MonitorStatusResponse["matchMethod"];
	expectedValue?: string;
	extracted?: unknown;
	overrides?: MonitorStatusResponseOverrides<T>;
}

export interface INetworkService {
	readonly serviceName: string;
	requestStatus(monitor: Monitor): Promise<MonitorStatusResponse>;
	requestWebhook(type: string, url: string, body: any): Promise<{ type: string; status: boolean; code: number; message: string; payload?: unknown }>;
	requestPagerDuty(args: { message: string; routingKey: string; monitorUrl: string }): Promise<boolean>;
	requestMatrix(args: { homeserverUrl: string; accessToken: string; roomId: string; message: string }): Promise<{
		status: boolean;
		code: number;
		message: string;
		payload?: unknown;
	}>;
}

class NetworkService implements INetworkService {
	static SERVICE_NAME = SERVICE_NAME;

	private TYPE_PING: string;
	private TYPE_HTTP: string;
	private TYPE_PAGESPEED: string;
	private TYPE_HARDWARE: string;
	private TYPE_DOCKER: string;
	private TYPE_PORT: string;
	private TYPE_GAME: string;
	private SERVICE_NAME: string;
	private NETWORK_ERROR: number;
	private PING_ERROR: number;

	private axios: any;
	private got: Got;
	private https: any;
	private jmespath: any;
	private GameDig: any;
	private ping: any;
	private logger: any;
	private http: any;
	private Docker: any;
	private net: any;
	private stringService: any;
	private settingsService: any;

	private buildStatusResponse = <T>({
		monitor,
		response,
		error,
		payload,
		jsonPath,
		matchMethod,
		expectedValue,
		extracted,
		overrides,
	}: BuildStatusResponseArgs<T>): MonitorStatusResponse<T> => {
		if (error) {
			const statusResponse: MonitorStatusResponse<T> = {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
				status: false,
				code: this.NETWORK_ERROR,
				message: error.message ?? "Network error",
				responseTime: 0,
				timings: undefined,
				jsonPath,
				matchMethod,
				expectedValue,
				extracted,
				payload,
			};
			if (error instanceof HTTPError || error instanceof RequestError) {
				statusResponse.code = error?.response?.statusCode ?? this.NETWORK_ERROR;
				statusResponse.message = error.message;
				statusResponse.responseTime = error.timings?.phases?.total ?? 0;
				statusResponse.timings = error.timings;
			}
			return { ...statusResponse, ...(overrides ?? {}) };
		}

		return {
			monitorId: monitor.id,
			teamId: monitor.teamId,
			type: monitor.type,
			status: response?.ok ?? false,
			code: response?.statusCode ?? this.NETWORK_ERROR,
			message: response?.statusMessage ?? "",
			responseTime: response?.timings?.phases?.total ?? 0,
			timings: response?.timings,
			payload: payload ?? response?.body,
			jsonPath,
			matchMethod,
			expectedValue,
			extracted,
			...(overrides ?? {}),
		};
	};

	constructor({
		axios,
		got,
		https,
		jmespath,
		GameDig,
		ping,
		logger,
		http,
		Docker,
		net,
		stringService,
		settingsService,
	}: {
		axios: any;
		got: Got;
		https: any;
		jmespath: any;
		GameDig: any;
		ping: any;
		logger: any;
		http: any;
		Docker: any;
		net: any;
		stringService: any;
		settingsService: any;
	}) {
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
		this.https = https;
		this.http = http;
		this.jmespath = jmespath;
		this.GameDig = GameDig;
		this.ping = ping;
		this.logger = logger;
		this.Docker = Docker;
		this.net = net;
		this.stringService = stringService;
		this.settingsService = settingsService;

		const cacheable = new CacheableLookup();

		this.got = got.extend({
			dnsCache: cacheable,
			timeout: {
				request: 30000,
			},
			retry: { limit: 1 },
		});
	}

	get serviceName(): string {
		return NetworkService.SERVICE_NAME;
	}

	// Helper functions
	private async timeRequest<T>(operation: () => Promise<T>): Promise<{ response: T | null; responseTime: number; error: unknown }> {
		const start = process.hrtime.bigint();
		try {
			const response = await operation();
			const elapsedMs = Math.round(Number(process.hrtime.bigint() - start) / 1_000_000);
			return { response, responseTime: elapsedMs, error: null };
		} catch (error) {
			const elapsedMs = Math.round(Number(process.hrtime.bigint() - start) / 1_000_000);
			return { response: null, responseTime: elapsedMs, error };
		}
	}

	// Main entry point
	async requestStatus(monitor: Monitor): Promise<MonitorStatusResponse> {
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
				return this.handleUnsupportedType(type);
		}
	}

	private async requestPing(monitor: Monitor): Promise<MonitorStatusResponse> {
		try {
			if (!monitor?.url) {
				throw new Error("Monitor URL is required");
			}

			const rawUrl = monitor.url;
			const sanitizedHost = rawUrl
				.replace(/^https?:\/\//, "")
				.replace(/\/.*$/, "")
				.replace(/:.*/, "");
			const { response, error } = await this.timeRequest(() => this.ping.promise.probe(sanitizedHost));

			if (!response) {
				if (error) {
					throw error;
				}
				throw new Error("Ping failed - no result returned");
			}

			const pingResponse = this.buildStatusResponse({
				monitor,
				payload: response,
				overrides: {
					status: (response as { alive?: boolean })?.alive ?? false,
					code: 200,
					message: "Success",
					responseTime: (response as { time?: number })?.time ?? 0,
					payload: response,
				},
			});

			if (error) {
				pingResponse.status = false;
				pingResponse.code = this.PING_ERROR;
				pingResponse.message = "Ping failed";
				return pingResponse;
			}

			return pingResponse;
		} catch (err: any) {
			err.service = this.SERVICE_NAME;
			err.method = "requestPing";
			throw err;
		}
	}

	private async requestHttp(monitor: Monitor): Promise<MonitorStatusResponse> {
		const { url, secret, id, teamId, type, ignoreTlsErrors, jsonPath, matchMethod, expectedValue } = monitor;
		const httpResponse = this.buildStatusResponse({
			monitor,
			overrides: {
				status: false,
				code: this.NETWORK_ERROR,
				message: "Request not executed",
			},
		});

		try {
			if (!url) {
				throw new Error("Monitor URL is required");
			}
			const config: Record<string, any> = {
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

			let payload: any;
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

			Object.assign(httpResponse, {
				code: response.statusCode,
				// 207 Multi-Status is used by Capture when some metrics fail - still a success
				status: response.ok || response.statusCode === 207,
				message: response.statusMessage ?? "",
				responseTime: response.timings.phases.total || 0,
				payload,
				timings: response.timings,
			});

			if (!expectedValue && !jsonPath) {
				return httpResponse;
			}

			if (expectedValue && !jsonPath) {
				let ok = false;
				if (matchMethod === "equal") ok = payload === expectedValue;
				if (matchMethod === "include" && typeof payload === "string") ok = payload.includes(expectedValue);
				if (matchMethod === "regex" && typeof payload === "string") ok = new RegExp(expectedValue).test(payload);

				if (ok === true) {
					return httpResponse;
				} else {
					httpResponse.code = 500;
					httpResponse.status = false;
					httpResponse.message = this.stringService.httpExpectedValueFail;
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
					const extracted = this.jmespath.search(payload, jsonPath);
					if (expectedValue) {
						let ok = false;
						if (matchMethod === "equal") ok = extracted === expectedValue;
						if (matchMethod === "include" && typeof extracted === "string") ok = extracted.includes(expectedValue);
						if (matchMethod === "regex" && typeof extracted === "string") ok = new RegExp(expectedValue).test(extracted);

						if (ok) {
							httpResponse.extracted = extracted;
							return httpResponse;
						} else {
							httpResponse.status = false;
							httpResponse.code = 500;
							httpResponse.message = this.stringService.httpJsonPathFail;
							httpResponse.extracted = extracted;
							return httpResponse;
						}
					} else {
						const isFalsey = extracted === false || extracted === "false" || extracted === undefined || extracted === null;
						if (!isFalsey) {
							httpResponse.extracted = extracted;
							return httpResponse;
						} else {
							httpResponse.status = false;
							httpResponse.code = 500;
							httpResponse.message = this.stringService.httpJsonPathFail;
							httpResponse.extracted = extracted;
							return httpResponse;
						}
					}
				} catch {
					httpResponse.status = false;
					httpResponse.message = this.stringService.httpJsonPathError;
					return httpResponse;
				}
			}
			return httpResponse;
		} catch (err: any) {
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

	private async requestPageSpeed(monitor: Monitor): Promise<MonitorStatusResponse> {
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
		} catch (err: any) {
			err.service = this.SERVICE_NAME;
			err.method = "requestPageSpeed";
			throw err;
		}
	}

	private async requestHardware(monitor: Monitor): Promise<MonitorStatusResponse> {
		try {
			// Fetch main metrics
			this.logger.info({
				message: "Fetching hardware metrics",
				service: this.SERVICE_NAME,
				method: "requestHardware",
				details: { url: monitor.url },
			});
			const mainResponse = await this.requestHttp(monitor);

			// If main request failed, return early
			if (!mainResponse.status) {
				this.logger.warn({
					message: "Main metrics request failed",
					service: this.SERVICE_NAME,
					method: "requestHardware",
					details: { url: monitor.url, code: mainResponse.code, msg: mainResponse.message },
				});
				return mainResponse;
			}

			// Only fetch Proxmox metrics if enabled for this monitor
			if (monitor?.enableProxmoxContainers === true) {
				try {
					const proxmoxUrl = this.buildProxmoxUrl(monitor.url);
					this.logger.info({
						message: "Attempting to fetch Proxmox metrics",
						service: this.SERVICE_NAME,
						method: "requestHardware",
						details: { proxmoxUrl },
					});
					if (proxmoxUrl) {
						const proxmoxResponse = await this.requestHttp({
							...monitor,
							url: proxmoxUrl,
						});

						// Proxmox response structure: { data: [...], errors: [...] | null, capture: {...} }
						const proxmoxPayload = proxmoxResponse.payload as {
							data?: unknown[] | null;
							errors?: Array<{ metric: string[]; err: string }> | null;
						};
						const mainPayload = mainResponse.payload as {
							data?: Record<string, unknown>;
							errors?: Array<{ metric: string[]; err: string }>;
						};

						// Handle based on Capture's response scenarios:
						// 1. Not configured: data=[], errors=null -> log and skip
						// 2. Connection failed: data=null, errors=[...] -> merge errors
						// 3. Partial failure: data=[...], errors=[...] -> merge both
						// 4. Success: data=[...], errors=null -> merge data

						if (proxmoxResponse.status && mainPayload?.data && typeof mainPayload.data === "object") {
							// Merge container data if available
							if (proxmoxPayload?.data && Array.isArray(proxmoxPayload.data)) {
								if (proxmoxPayload.data.length > 0) {
									(mainPayload.data as Record<string, unknown>).containers = proxmoxPayload.data;
									this.logger.info({
										message: "Successfully merged Proxmox container data",
										service: this.SERVICE_NAME,
										method: "requestHardware",
										details: { containerCount: proxmoxPayload.data.length },
									});
								} else {
									this.logger.debug({
										message: "Proxmox returned empty container list (not configured or no containers running)",
										service: this.SERVICE_NAME,
										method: "requestHardware",
									});
								}
							}

							// Merge Proxmox errors into main errors array
							if (proxmoxPayload?.errors && Array.isArray(proxmoxPayload.errors) && proxmoxPayload.errors.length > 0) {
								if (!mainPayload.errors) {
									mainPayload.errors = [];
								}
								mainPayload.errors.push(...proxmoxPayload.errors);
								this.logger.warn({
									message: "Proxmox returned errors",
									service: this.SERVICE_NAME,
									method: "requestHardware",
									details: { errors: proxmoxPayload.errors },
								});
							}
						} else if (!proxmoxResponse.status) {
							this.logger.warn({
								message: "Proxmox request failed",
								service: this.SERVICE_NAME,
								method: "requestHardware",
								details: { status: proxmoxResponse.status, code: proxmoxResponse.code },
							});
						}
					}
				} catch (proxmoxErr: any) {
					// Log but don't fail - Proxmox is optional
					this.logger.warn({
						message: "Proxmox fetch error (optional)",
						service: this.SERVICE_NAME,
						method: "requestHardware",
						details: { error: proxmoxErr.message },
					});
				}
			}

			return mainResponse;
		} catch (err: any) {
			err.service = this.SERVICE_NAME;
			err.method = "requestHardware";
			throw err;
		}
	}

	/**
	 * Builds the Proxmox metrics URL from the main metrics URL
	 * e.g., http://localhost:59232/api/v1/metrics -> http://localhost:59232/api/v1/metrics/proxmox
	 */
	private buildProxmoxUrl(baseUrl: string | undefined): string | null {
		if (!baseUrl) return null;
		try {
			const url = new URL(baseUrl);
			// Append /proxmox to the path
			url.pathname = url.pathname.replace(/\/?$/, "/proxmox");
			return url.toString();
		} catch {
			return null;
		}
	}

	private async requestDocker(monitor: Monitor): Promise<MonitorStatusResponse> {
		try {
			if (!monitor.url) {
				throw new Error("Monitor URL is required");
			}

			const docker = new this.Docker({
				socketPath: "/var/run/docker.sock",
				handleError: true, // Enable error handling
			});

			const dockerResponse = this.buildStatusResponse({
				monitor,
				overrides: {
					status: false,
					code: this.NETWORK_ERROR,
					message: "No response",
				},
			});

			const containers = await docker.listContainers({ all: true });

			// Normalize input: strip leading slashes and convert to lowercase for comparison
			const normalizedInput = monitor.url.replace(/^\/+/, "").toLowerCase();

			// Priority-based matching to avoid ambiguity:
			// 1. Exact full ID match (64-char)
			let exactIdMatch = containers.find((c: any) => c.Id.toLowerCase() === normalizedInput);

			// 2. Exact container name match (case-insensitive)
			let exactNameMatch = containers.find((c: any) =>
				c.Names.some((name: string) => {
					const cleanName = name.replace(/^\/+/, "").toLowerCase();
					return cleanName === normalizedInput;
				})
			);

			// 3. Partial ID match (fallback for backwards compatibility)
			let partialIdMatch = containers.find((c: any) => c.Id.toLowerCase().startsWith(normalizedInput));

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
				dockerResponse.status = false;
				dockerResponse.message = `Ambiguous container match for "${monitor.url}". Matched by: ${matchTypes.join(", ")}. Using ${exactIdMatch ? "exact ID" : exactNameMatch ? "exact name" : "partial ID"} match.`;
				return dockerResponse;
			}

			const container = docker.getContainer(targetContainer.Id);
			const { response, responseTime, error }: { response?: any; responseTime?: number; error?: any } = await this.timeRequest(() =>
				container.inspect()
			);

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
		} catch (err: any) {
			err.service = this.SERVICE_NAME;
			err.method = "requestDocker";
			throw err;
		}
	}

	private async requestPort(monitor: Monitor): Promise<MonitorStatusResponse> {
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

					socket.on("error", (err: any) => {
						socket.destroy();
						reject(err);
					});
				});
			});

			const portResponse = this.buildStatusResponse({
				monitor,
				overrides: {
					code: 200,
					status: (response as { success?: boolean })?.success ?? false,
					message: this.stringService.portSuccess,
					responseTime,
				},
			});

			if (error) {
				portResponse.code = this.NETWORK_ERROR;
				portResponse.status = false;
				portResponse.message = this.stringService.portFail;
				return portResponse;
			}

			return portResponse;
		} catch (error: any) {
			error.service = this.SERVICE_NAME;
			error.method = "requestTCP";
			throw error;
		}
	}

	private async requestGame(monitor: Monitor): Promise<MonitorStatusResponse> {
		try {
			const { url, port, gameId } = monitor;

			const gameResponse = this.buildStatusResponse({
				monitor,
				overrides: {
					code: 200,
					status: true,
					message: "Success",
				},
			});

			const state = await this.GameDig.query({
				type: gameId,
				host: url,
				port: port,
			}).catch((error: any) => {
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
		} catch (error: any) {
			error.service = this.SERVICE_NAME;
			error.method = "requestPing";
			throw error;
		}
	}
	private async handleUnsupportedType(type: string): Promise<MonitorStatusResponse> {
		return {
			monitorId: "unknown",
			teamId: "unknown",
			type: "unknown",
			status: false,
			code: this.NETWORK_ERROR,
			message: `Unsupported type: ${type}`,
		};
	}

	// Other network requests unrelated to monitoring:
	async requestWebhook(type: string, url: string, body: any) {
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
		} catch (error: any) {
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

	async requestPagerDuty({ message, routingKey, monitorUrl }: { message: string; routingKey: string; monitorUrl: string }) {
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
		} catch (error: any) {
			error.details = error.response?.data;
			error.service = this.SERVICE_NAME;
			error.method = "requestPagerDuty";
			throw error;
		}
	}

	async requestMatrix({
		homeserverUrl,
		accessToken,
		roomId,
		message,
	}: {
		homeserverUrl: string;
		accessToken: string;
		roomId: string;
		message: string;
	}) {
		try {
			const url = `${homeserverUrl}/_matrix/client/v3/rooms/${roomId}/send/m.room.message?access_token=${accessToken}`;
			const body = {
				msgtype: "m.text",
				body: message,
				format: "org.matrix.custom.html",
				formatted_body: message,
			};
			const response = await this.axios.post(url, body, {
				headers: {
					"Content-Type": "application/json",
				},
			});

			return {
				status: true,
				code: response.status,
				message: "Successfully sent Matrix notification",
			};
		} catch (error: any) {
			this.logger.warn({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "requestMatrix",
			});

			return {
				status: false,
				code: error.response?.status || this.NETWORK_ERROR,
				message: "Failed to send Matrix notification",
				payload: error.response?.data,
			};
		}
	}
}

export default NetworkService;
