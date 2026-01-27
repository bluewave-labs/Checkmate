import { useState, useCallback } from "react";
import { networkService } from "../../../main.jsx";
import { createToast } from "../../../Utils/toastUtils.jsx";
import { useTranslation } from "react-i18next";
/**
 * Hook to fetch and manage incidents
 *
 * Provides multiple functions to fetch incidents with different filters.
 *
 * @returns {Object} {
 *   incidents,
 *   incidentsCount,
 *   isLoading,
 *   networkError,
 *   fetchIncidents,
 *   fetchActiveIncidents,
 *   fetchResolvedIncidents,
 *   fetchIncidentsByTeam,
 *   fetchIncidentById,
 *   resolveIncident,
 *   fetchIncidentSummary
 * }
 */
const useFetchIncidents = () => {
	const [incidents, setIncidents] = useState(null);
	const [incidentsCount, setIncidentsCount] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [networkError, setNetworkError] = useState(false);
	const { t } = useTranslation();
	/**
	 * Generic function to fetch incidents by team with custom config
	 *
	 * @param {Object} config - Configuration object
	 * @param {string} [config.monitorId] - Filter by monitor ID
	 * @param {boolean} [config.status] - Filter by status (true=active, false=resolved)
	 * @param {string} [config.resolutionType] - Filter by resolution type (automatic/manual)
	 * @param {string} [config.sortOrder] - Sort order (asc/desc)
	 * @param {string} [config.dateRange] - Date range filter
	 * @param {number} [config.page] - Page number
	 * @param {number} [config.rowsPerPage] - Rows per page
	 */
	const fetchIncidentsByTeam = useCallback(async (config = {}) => {
		try {
			setIsLoading(true);
			setNetworkError(false);

			const res = await networkService.getIncidentsByTeam(config);
			setIncidents(res.data?.data?.incidents || []);
			setIncidentsCount(res.data?.data?.count || 0);
		} catch (error) {
			setNetworkError(true);
			console.error(t("incidentsPage.errorFetchingIncidents"), error);
			createToast({ body: error.message || t("incidentsPage.errorFetchingIncidents") });
		} finally {
			setIsLoading(false);
		}
	}, []);

	/**
	 * Fetch active (open) incidents - Default function
	 *
	 * @param {Object} config - Additional configuration
	 */
	const fetchActiveIncidents = useCallback(
		async (config = {}) => {
			await fetchIncidentsByTeam({
				status: true,
				sortOrder: "desc",
				...config,
			});
		},
		[fetchIncidentsByTeam]
	);

	const fetchIncidentsByResolutionType = useCallback(
		async (resolutionType, config = {}) => {
			await fetchIncidentsByTeam({
				resolutionType,
				sortOrder: "desc",
				...config,
			});
		},
		[fetchIncidentsByTeam]
	);
	/**
	 * Fetch resolved incidents
	 *
	 * @param {Object} config - Additional configuration
	 */
	const fetchResolvedIncidents = useCallback(
		async (config = {}) => {
			await fetchIncidentsByTeam({
				status: false,
				sortOrder: "desc",
				...config,
			});
		},
		[fetchIncidentsByTeam]
	);

	/**
	 * Fetch incidents with custom filters (alias for fetchIncidentsByTeam)
	 *
	 * @param {Object} config - Configuration object
	 */
	const fetchIncidents = useCallback(
		async (config = {}) => {
			await fetchIncidentsByTeam(config);
		},
		[fetchIncidentsByTeam]
	);

	/**
	 * Fetch a single incident by ID
	 *
	 * @param {string} incidentId - The ID of the incident to fetch
	 * @returns {Promise<Object|null>} The incident object or null if not found
	 */
	const fetchIncidentById = useCallback(async (incidentId) => {
		if (!incidentId) {
			console.error(t("incidentsPage.noIncidentIdProvided"));
			return null;
		}

		try {
			setIsLoading(true);
			setNetworkError(false);

			const res = await networkService.getIncidentById(incidentId);
			return res.data?.data || null;
		} catch (error) {
			setNetworkError(true);
			console.error(t("incidentsPage.errorFetchingIncident"), error);
			createToast({ body: error.message || t("incidentsPage.errorFetchingIncident") });
			return null;
		} finally {
			setIsLoading(false);
		}
	}, []);

	/**
	 * Resolve an incident manually
	 *
	 * @param {string} incidentId - The ID of the incident to resolve
	 * @param {Object} options - Resolution options
	 * @param {string} [options.comment] - Optional comment about the resolution
	 * @param {Function} [onSuccess] - Callback function to call on success
	 * @param {Function} [onError] - Callback function to call on error
	 */
	const resolveIncident = useCallback(async (incidentId, options = {}) => {
		if (!incidentId) {
			console.error(t("incidentsPage.noIncidentIdProvided"));
			return;
		}

		try {
			setIsLoading(true);
			setNetworkError(false);

			const res = await networkService.resolveIncidentManually(incidentId, options);
			if (res.data?.success) {
				createToast({ body: t("incidentsPage.incidentResolvedSuccessfully") });
			} else {
				createToast({ body: t("incidentsPage.errorResolvingIncident") });
			}
		} catch (error) {
			setNetworkError(true);
			console.error(t("incidentsPage.errorResolvingIncident"), error);
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				t("incidentsPage.errorResolvingIncident");
			createToast({ body: errorMessage });
		} finally {
			setIsLoading(false);
		}
	}, []);

	/**
	 * Fetch incident summary
	 *
	 * @param {Object} config - Configuration object
	 * @param {number} [config.limit=10] - Number of latest incidents to return
	 * @returns {Promise<Object|null>} The summary object or null if error
	 */
	const fetchIncidentSummary = useCallback(async (config = {}) => {
		try {
			const res = await networkService.getIncidentSummary(config);
			return res.data?.data || null;
		} catch (error) {
			console.error(t("incidentsPage.errorFetchingIncidentSummary"), error);
			createToast({
				body: error.message || t("incidentsPage.errorFetchingIncidentSummary"),
			});
			return null;
		}
	}, []);

	return {
		incidents,
		incidentsCount,
		isLoading,
		networkError,
		fetchIncidents,
		fetchActiveIncidents,
		fetchResolvedIncidents,
		fetchIncidentsByTeam,
		fetchIncidentById,
		resolveIncident,
		fetchIncidentSummary,
		fetchIncidentsByResolutionType,
	};
};

export default useFetchIncidents;
