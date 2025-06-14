import axios from "axios";
import i18next from "i18next";
const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
const FALLBACK_BASE_URL = "http://localhost:5000/api/v1";
import { clearAuthState } from "../Features/Auth/authSlice";
class NetworkService {
	constructor(store, dispatch, navigate) {
		this.store = store;
		this.dispatch = dispatch;
		this.navigate = navigate;
		let baseURL = BASE_URL;
		this.axiosInstance = axios.create();
		this.setBaseUrl(baseURL);
		this.unsubscribe = store.subscribe(() => {
			const state = store.getState();
			if (BASE_URL !== undefined) {
				baseURL = BASE_URL;
			} else if (state?.settings?.apiBaseUrl ?? null) {
				baseURL = state.settings.apiBaseUrl;
			} else {
				baseURL = FALLBACK_BASE_URL;
			}
			this.setBaseUrl(baseURL);
		});
		this.axiosInstance.interceptors.request.use(
			(config) => {
				const currentLanguage = i18next.language || "en";

				const { authToken } = store.getState().auth;

				config.headers = {
					Authorization: `Bearer ${authToken}`,
					"Accept-Language": currentLanguage === "gb" ? "en" : currentLanguage,
					...config.headers,
				};

				return config;
			},
			(error) => {
				return Promise.reject(error);
			}
		);
		this.axiosInstance.interceptors.response.use(
			(response) => response,
			(error) => {
				// Handle network errors (server unreachable)
				if (error.code === "ERR_NETWORK") {
					// Navigate to server unreachable page
					navigate("/server-unreachable");
					// Return an empty resolved promise to stop the error propagation
					return Promise.reject(error);
				}

				// Handle authentication errors

				if (error.response && error.response.status === 401) {
					dispatch(clearAuthState());
					navigate("/login");
				} else if (error.request && !error.response) {
					return Promise.reject(error);
				}
				return Promise.reject(error);
			}
		);
	}

	setBaseUrl = (url) => {
		this.axiosInstance.defaults.baseURL = url;
	};

	cleanup() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	/**
	 *
	 * ************************************
	 * Create a new monitor
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.monitorId - The monitor ID to be sent in the param.
	 * @returns {Promise<AxiosResponse>} The response from the axios GET request.
	 */

	async getMonitorById(config) {
		return this.axiosInstance.get(`/monitors/${config.monitorId}`, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	/**
	 *
	 * ************************************
	 * Create a new monitor
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {Object} config.monitor - The monitor object to be sent in the request body.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 */
	async createMonitor(config) {
		const { monitor } = config;

		return this.axiosInstance.post(`/monitors`, monitor);
	}

	/**
	 *
	 * ************************************
	 * Check the endpoint resolution
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {Object} config.monitorURL - The monitor url to be sent in the request body.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 */
	async checkEndpointResolution(config) {
		const { monitorURL } = config;
		const params = new URLSearchParams();

		if (monitorURL) params.append("monitorURL", monitorURL);

		return this.axiosInstance.get(`/monitors/resolution/url?${params.toString()}`, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	/**
	 * ************************************
	 * Get all uptime monitors for a Team
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.teamId - The ID of the team whose monitors are to be retrieved.
	 * @param {number} [config.limit] - The maximum number of checks to retrieve.  0 for all, -1 for none
	 * @param {Array<string>} [config.types] - The types of monitors to retrieve.
	 * @param {number} [config.page] - The page number for pagination.
	 * @param {number} [config.rowsPerPage] - The number of rows per page for pagination.
	 * @param {string} [config.filter] - The filter to apply to the monitors.
	 * @param {string} [config.field] - The field to sort by.
	 * @param {string} [config.order] - The order in which to sort the field.
	 * @returns {Promise<AxiosResponse>} The response from the axios GET request.
	 */

	async getMonitorsByTeamId(config) {
		const { limit, types, page, rowsPerPage, filter, field, order } = config;
		const params = new URLSearchParams();

		if (limit) params.append("limit", limit);
		if (types) {
			types.forEach((type) => {
				params.append("type", type);
			});
		}
		if (page) params.append("page", page);
		if (rowsPerPage) params.append("rowsPerPage", rowsPerPage);
		if (filter) params.append("filter", filter);
		if (field) params.append("field", field);
		if (order) params.append("order", order);

		return this.axiosInstance.get(`/monitors/team?${params.toString()}`, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	/**
	 * ************************************
	 * Get stats for a monitor
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.monitorId - The ID of the monitor whose statistics are to be retrieved.
	 * @param {string} config.sortOrder - The order in which to sort the retrieved statistics.
	 * @param {number} config.limit - The maximum number of statistics to retrieve.
	 * @param {string} config.dateRange - The date range for which to retrieve statistics.
	 * @param {number} config.numToDisplay - The number of checks to display.
	 * @param {boolean} config.normalize - Whether to normalize the retrieved statistics.
	 * @returns {Promise<AxiosResponse>} The response from the axios GET request.
	 */
	async getStatsByMonitorId(config) {
		const params = new URLSearchParams();
		if (config.sortOrder) params.append("sortOrder", config.sortOrder);
		if (config.limit) params.append("limit", config.limit);
		if (config.dateRange) params.append("dateRange", config.dateRange);
		if (config.numToDisplay) params.append("numToDisplay", config.numToDisplay);
		if (config.normalize) params.append("normalize", config.normalize);

		return this.axiosInstance.get(
			`/monitors/stats/${config.monitorId}?${params.toString()}`
		);
	}

	async getHardwareDetailsByMonitorId(config) {
		const params = new URLSearchParams();
		if (config.dateRange) params.append("dateRange", config.dateRange);

		return this.axiosInstance.get(
			`/monitors/hardware/details/${config.monitorId}?${params.toString()}`
		);
	}
	async getUptimeDetailsById(config) {
		const params = new URLSearchParams();
		if (config.dateRange) params.append("dateRange", config.dateRange);
		if (config.normalize) params.append("normalize", config.normalize);

		return this.axiosInstance.get(
			`/monitors/uptime/details/${config.monitorId}?${params.toString()}`
		);
	}

	/**
	 * ************************************
	 * Updates a single monitor
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.monitorId - The ID of the monitor to be updated.
	 * @param {Object} config.updatedFields - The fields to be updated for the monitor.
	 * @returns {Promise<AxiosResponse>} The response from the axios PUT request.
	 */
	async updateMonitor(config) {
		const { monitorId, updatedFields } = config;
		const payload = updatedFields;
		return this.axiosInstance.put(`/monitors/${monitorId}`, payload, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	/**
	 * ************************************
	 * Deletes a single monitor by its ID
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.monitorId - The ID of the monitor to be deleted.
	 * @returns {Promise<AxiosResponse>} The response from the axios DELETE request.
	 */
	async deleteMonitorById(config) {
		return this.axiosInstance.delete(`/monitors/${config.monitorId}`, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	/**
	 * ************************************
	 * Deletes all checks for all monitor by teamID
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.teamId - The team ID of the monitors to be deleted.
	 * @returns {Promise<AxiosResponse>} The response from the axios DELETE request.
	 */
	async deleteChecksByTeamId(config) {
		return this.axiosInstance.delete(`/checks/team`, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}
	/**
	 * ************************************
	 * Pauses a single monitor by its ID
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.monitorId - The ID of the monitor to be paused.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 */
	async pauseMonitorById(config) {
		return this.axiosInstance.post(
			`/monitors/pause/${config.monitorId}`,
			{},
			{
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}

	/**
	 * ************************************
	 * Adds demo monitors
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 */
	async addDemoMonitors(config) {
		return this.axiosInstance.post(
			`/monitors/demo`,
			{},
			{
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}

	/**
	 * ************************************
	 * Deletes all monitors for a team by team ID
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @returns {Promise<AxiosResponse>} The response from the axios DELETE request.
	 */
	async deleteAllMonitors(config) {
		return this.axiosInstance.delete(`/monitors/`, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	/**
	 * ************************************
	 * Gets the certificate expiry for a monitor
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.monitorId - The ID of the monitor whose certificate expiry is to be retrieved.
	 * @returns {Promise<AxiosResponse>} The response from the axios GET request.
	 *
	 */
	async getCertificateExpiry(config) {
		return this.axiosInstance.get(`/monitors/certificate/${config.monitorId}`);
	}

	/**
	 * ************************************
	 * Registers a new user
	 * ************************************
	 *
	 * @async
	 * @param {Object} form - The form data for the new user to be registered.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 */
	async registerUser(form) {
		return this.axiosInstance.post(`/auth/register`, form);
	}

	/**
	 * ************************************
	 * Logs in a user
	 * ************************************
	 *
	 * @async
	 * @param {Object} form - The form data for the user to be logged in.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 *
	 */
	async loginUser(form) {
		return this.axiosInstance.post(`/auth/login`, form);
	}

	/**
	 * ************************************
	 * Updates a user
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.userId - The ID of the user to be updated.
	 * @param {Object} config.form - The form data for the user to be updated.
	 * @returns {Promise<AxiosResponse>} The response from the axios PUT request.
	 *
	 */
	async updateUser(config) {
		return this.axiosInstance.put(`/auth/user/${config.userId}`, config.form);
	}

	/**
	 * ************************************
	 * Deletes a user
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.userId - The ID of the user to be deleted.
	 *
	 **/
	async deleteUser(config) {
		return this.axiosInstance.delete(`/auth/user/${config.userId}`);
	}

	/**
	 * ************************************
	 * Forgot password request
	 * ************************************
	 *
	 * @async
	 * @param {Object} form - The form data for the password recovery request.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 *
	 */
	async forgotPassword(form) {
		return this.axiosInstance.post(`/auth/recovery/request`, form);
	}

	/**
	 * ************************************
	 * Validates a recovery token
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.recoveryToken - The recovery token to be validated.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 *
	 */
	async validateRecoveryToken(config) {
		return this.axiosInstance.post("/auth/recovery/validate", {
			recoveryToken: config.recoveryToken,
		});
	}

	/**
	 * ************************************
	 * Requests password recovery
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.recoveryToken - The token for recovery request.
	 * @param {Object} config.form - The form data for the password recovery request.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 *
	 */
	async setNewPassword(config) {
		return this.axiosInstance.post("/auth/recovery/reset", {
			...config.form,
			recoveryToken: config.recoveryToken,
		});
	}

	/**
	 * ************************************
	 * Checks if an admin user exists
	 * ************************************
	 *
	 * @async
	 * @returns {Promise<AxiosResponse>} The response from the axios GET request.
	 *
	 */
	async doesSuperAdminExist() {
		return this.axiosInstance.get("/auth/users/superadmin");
	}

	/**
	 * ************************************
	 * Get all users
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @returns {Promise<AxiosResponse>} The response from the axios GET request.
	 *
	 */
	async getAllUsers(config) {
		return this.axiosInstance.get("/auth/users");
	}

	/**
	 * ************************************
	 * Requests an invitation token
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.email - The email of the user to be invited.
	 * @param {string} config.role - The role of the user to be invited.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 *
	 */
	async requestInvitationToken(config) {
		return this.axiosInstance.post(`/invite`, { email: config.email, role: config.role });
	}
	/**
	 * ************************************
	 * Sends an invitation token
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.email - The email of the user to be invited.
	 * @param {string} config.role - The role of the user to be invited.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 *
	 */
	async sendInvitationToken(config) {
		return this.axiosInstance.post(`/invite/send`, {
			email: config.email,
			role: config.role,
		});
	}

	/**
	 * ************************************
	 * Verifies an invitation token
	 * ************************************
	 *
	 * @async
	 * @param {string} token - The invitation token to be verified.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 *
	 */
	async verifyInvitationToken(token) {
		return this.axiosInstance.post(`/invite/verify`, {
			token,
		});
	}

	/**
	 * ************************************
	 * Get all checks for a given monitor
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.monitorId - The ID of the monitor.
	 * @param {string} config.sortOrder - The order in which to sort the checks.
	 * @param {number} config.limit - The maximum number of checks to retrieve.
	 * @param {string} config.dateRange - The range of dates for which to retrieve checks.
	 * @param {string} config.filter - The filter to apply to the checks.
	 * @param {number} config.page - The page number to retrieve in a paginated list.
	 * @param {number} config.rowsPerPage - The number of rows per page in a paginated list.
	 * @returns {Promise<AxiosResponse>} The response from the axios GET request.
	 *
	 */

	getChecksByMonitor = async (config) => {
		const params = new URLSearchParams();
		if (config.type) params.append("type", config.type);
		if (config.sortOrder) params.append("sortOrder", config.sortOrder);
		if (config.limit) params.append("limit", config.limit);
		if (config.dateRange) params.append("dateRange", config.dateRange);
		if (config.filter) params.append("filter", config.filter);
		if (config.page) params.append("page", config.page);
		if (config.rowsPerPage) params.append("rowsPerPage", config.rowsPerPage);
		if (config.status !== undefined) params.append("status", config.status);

		return this.axiosInstance.get(`/checks/${config.monitorId}?${params.toString()}`);
	};

	/**
	 * ************************************
	 * Get all checks for a given user
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.userId - The ID of the user.
	 * @param {string} config.sortOrder - The order in which to sort the checks.
	 * @param {number} config.limit - The maximum number of checks to retrieve.
	 * @param {string} config.dateRange - The range of dates for which to retrieve checks.
	 * @param {string} config.filter - The filter to apply to the checks.
	 * @param {number} config.page - The page number to retrieve in a paginated list.
	 * @param {number} config.rowsPerPage - The number of rows per page in a paginated list.
	 * @returns {Promise<AxiosResponse>} The response from the axios GET request.
	 *
	 */
	getChecksByTeam = async (config) => {
		const params = new URLSearchParams();
		if (config.sortOrder) params.append("sortOrder", config.sortOrder);
		if (config.limit) params.append("limit", config.limit);
		if (config.dateRange) params.append("dateRange", config.dateRange);
		if (config.filter) params.append("filter", config.filter);
		if (config.page) params.append("page", config.page);
		if (config.rowsPerPage) params.append("rowsPerPage", config.rowsPerPage);
		if (config.status !== undefined) params.append("status", config.status);
		return this.axiosInstance.get(`/checks/team?${params.toString()}`);
	};

	/**
	 * ************************************
	 * Get all checks for a given user
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {number} config.ttl - TTL for checks
	 * @returns {Promise<AxiosResponse>} The response from the axios GET request.
	 *
	 */
	async updateChecksTTL(config) {
		return this.axiosInstance.put(
			`/checks/team/ttl`,
			{ ttl: config.ttl },
			{
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}

	/**
	 * ************************************
	 * Get app settings
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @returns {Promise<AxiosResponse>} The response from the axios GET request.
	 *
	 */

	async getAppSettings(config) {
		return this.axiosInstance.get("/settings", {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	/**
	 *
	 * ************************************
	 * Create a new monitor
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {Object} config.settings - The monitor object to be sent in the request body.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 */
	async updateAppSettings(config) {
		return this.axiosInstance.put(`/settings`, config.settings, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	/**
	 * ************************************
	 * Test a notification integration
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} config.platform - The notification platform (slack, discord, telegram, webhook).
	 * @param {Object} config.payload - The payload with configuration for the notification.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 */
	async testNotification(config) {
		return this.axiosInstance.post("/notifications/test", config.notification, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	/**
	 * ************************************
	 * Creates a maintenance window
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {Object} config.maintenanceWindow - The maintenance window object to be sent in the request body.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 *
	 */

	async createMaintenanceWindow(config) {
		return this.axiosInstance.post(`/maintenance-window`, config.maintenanceWindow, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	/**
	 * ************************************
	 * Edits a maintenance window
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {Object} config.maintenanceWindowId - The maintenance window id.
	 * @param {Object} config.maintenanceWindow - The maintenance window object to be sent in the request body.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 *
	 */

	async editMaintenanceWindow(config) {
		return this.axiosInstance.put(
			`/maintenance-window/${config.maintenanceWindowId}`,
			config.maintenanceWindow,
			{
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}

	/**
	 * ************************************
	 * Get maintenance window by id
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} [config.maintenanceWindowId] - The id of the maintenance window to delete.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 *
	 */

	async getMaintenanceWindowById(config) {
		const { maintenanceWindowId } = config;
		return this.axiosInstance.get(`/maintenance-window/${maintenanceWindowId}`, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	/**
	 * ************************************
	 * Get maintenance windows by teamId
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} [config.active] - The status of the maintenance windows to retrieve.
	 * @param {number} [config.page] - The page number for pagination.
	 * @param {number} [config.rowsPerPage] - The number of rows per page for pagination.
	 * @param {string} [config.field] - The field to sort by.
	 * @param {string} [config.order] - The order in which to sort the field.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 *
	 */

	async getMaintenanceWindowsByTeamId(config) {
		const { active, page, rowsPerPage, field, order } = config;
		const params = new URLSearchParams();

		if (active) params.append("status", active);
		if (page) params.append("page", page);
		if (rowsPerPage) params.append("rowsPerPage", rowsPerPage);
		if (field) params.append("field", field);
		if (order) params.append("order", order);

		return this.axiosInstance.get(`/maintenance-window/team?${params.toString()}`, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}
	/**
	 * ************************************
	 * Delete maintenance window by id
	 * ************************************
	 *
	 * @async
	 * @param {Object} config - The configuration object.
	 * @param {string} [config.maintenanceWindowId] - The id of the maintenance window to delete.
	 * @returns {Promise<AxiosResponse>} The response from the axios POST request.
	 *
	 */

	async deleteMaintenanceWindow(config) {
		const { maintenanceWindowId } = config;
		return this.axiosInstance.delete(`/maintenance-window/${maintenanceWindowId}`, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	/**
	 * ************************************
	 * Fetcher github latest release version
	 * ************************************
	 *
	 * @async
	 * @returns {Promise<AxiosResponse>} The response from the axios GET request.
	 *
	 */
	async fetchGithubLatestRelease() {
		return this.axiosInstance.get(
			"https://api.github.com/repos/bluewave-labs/checkmate/releases/latest",
			{
				headers: {
					Authorization: null, // No authorization header for this request
				},
			}
		);
	}

	async getStatusPage() {
		return this.axiosInstance.get(`/status-page`, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	async getStatusPageByUrl(config) {
		const { url, type } = config;
		const params = new URLSearchParams();
		params.append("type", type);

		return this.axiosInstance.get(`/status-page/${url}?${params.toString()}`, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	async getStatusPagesByTeamId(config) {
		return this.axiosInstance.get(`/status-page/team`, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	async createStatusPage(config) {
		const { form, isCreate } = config;

		const fd = new FormData();
		fd.append("type", form.type);
		form.isPublished !== undefined && fd.append("isPublished", form.isPublished);
		form.companyName && fd.append("companyName", form.companyName);
		form.url && fd.append("url", form.url);
		form.timezone && fd.append("timezone", form.timezone);
		form.color && fd.append("color", form.color);
		if (form.showCharts !== undefined) {
			fd.append("showCharts", String(form.showCharts));
		}
		if (form.showUptimePercentage !== undefined) {
			fd.append("showUptimePercentage", String(form.showUptimePercentage));
		}
		form.monitors &&
			form.monitors.forEach((monitorId) => {
				fd.append("monitors[]", monitorId);
			});
		// Handle subMonitors, even if it's an empty array
		if (form.subMonitors && form.subMonitors.length > 0) {
			form.subMonitors.forEach((monitorId) => {
				fd.append("subMonitors[]", monitorId);
			});
		} else {
			fd.append("deleteSubmonitors", true);
		}

		if (form?.logo?.src && form?.logo?.src !== "") {
			const imageResult = await axios.get(form.logo.src, {
				responseType: "blob",
			});
			fd.append("logo", imageResult.data);
			// Cleanup blob
			if (form.logo.src.startsWith("blob:")) {
				URL.revokeObjectURL(form.logo.src);
			}
		}

		if (isCreate) {
			return this.axiosInstance.post(`/status-page`, fd, {});
		}

		return this.axiosInstance.put(`/status-page`, fd, {});
	}

	async deleteStatusPage(config) {
		const { url } = config;
		const encodedUrl = encodeURIComponent(url);

		return this.axiosInstance.delete(`/status-page/${encodedUrl}`, {});
	}

	// ************************************
	// Create bulk monitors
	// ************************************

	async createBulkMonitors(formData) {
		const response = await this.axiosInstance.post(`/monitors/bulk`, formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
		return response.data;
	}

	// ************************************
	// Fetch monitors with summary by TeamID
	// ************************************
	async getMonitorsWithSummaryByTeamId(config) {
		const { types } = config;
		const params = new URLSearchParams();

		if (types) {
			types.forEach((type) => {
				params.append("type", type);
			});
		}

		return this.axiosInstance.get(`/monitors/summary/team?${params.toString()}`, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	// ************************************
	// Fetch monitors with checks by TeamID
	// ************************************
	async getMonitorsWithChecksByTeamId(config) {
		const { limit, types, page, rowsPerPage, filter, field, order } = config;
		const params = new URLSearchParams();

		if (limit) params.append("limit", limit);
		if (types) {
			types.forEach((type) => {
				params.append("type", type);
			});
		}
		if (page) params.append("page", page);
		if (rowsPerPage) params.append("rowsPerPage", rowsPerPage);
		if (filter) params.append("filter", filter);
		if (field) params.append("field", field);
		if (order) params.append("order", order);

		return this.axiosInstance.get(`/monitors/team/with-checks?${params.toString()}`, {
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	// ************************************
	// Send test email
	// ************************************
	async sendTestEmail(config) {
		// Extract recipient and email configuration
		const { to, emailConfig } = config;

		// If emailConfig is provided, use the new endpoint with direct parameters
		if (emailConfig) {
			return this.axiosInstance.post(`/settings/test-email`, {
				to,
				systemEmailHost: emailConfig.systemEmailHost,
				systemEmailPort: emailConfig.systemEmailPort,
				systemEmailAddress: emailConfig.systemEmailAddress,
				systemEmailPassword: emailConfig.systemEmailPassword,
				systemEmailSecure: emailConfig.systemEmailSecure,
				systemEmailPool: emailConfig.systemEmailPool,
				systemEmailIgnoreTLS: emailConfig.systemEmailIgnoreTLS,
				systemEmailRequireTLS: emailConfig.systemEmailRequireTLS,
				systemEmailRejectUnauthorized: emailConfig.systemEmailRejectUnauthorized,
				systemEmailTLSServername: emailConfig.systemEmailTLSServername,
				...(emailConfig.systemEmailUser && {
					systemEmailUser: emailConfig.systemEmailUser,
				}),
			});
		}

		// Fallback to original behavior for backward compatibility
		return this.axiosInstance.post(`/settings/test-email`, { to });
	}

	async createNotification(config) {
		const { notification } = config;
		return this.axiosInstance.post(`/notifications`, notification);
	}

	async getNotificationsByTeamId(config) {
		return this.axiosInstance.get(`/notifications/team`);
	}

	async deleteNotificationById(config) {
		const { id } = config;
		return this.axiosInstance.delete(`/notifications/${id}`);
	}

	async getNotificationById(config) {
		const { id } = config;
		return this.axiosInstance.get(`/notifications/${id}`);
	}

	async editNotification(config) {
		const { id, notification } = config;
		return this.axiosInstance.put(`/notifications/${id}`, notification);
	}
}

export default NetworkService;

let networkService;

export const setNetworkService = (service) => {
	networkService = service;
};
export { networkService };
