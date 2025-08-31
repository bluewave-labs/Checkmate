import { useState, useEffect } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";
import { useTranslation } from "react-i18next";

const useFetchLogs = () => {
	const { t } = useTranslation();
	const [logs, setLogs] = useState(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);

	useEffect(() => {
		const fetchLogs = async () => {
			try {
				setIsLoading(true);
				const response = await networkService.getLogs();
				setLogs(response.data.data);
			} catch (error) {
				setError(error);
				createToast({
					message: error.message,
				});
			} finally {
				setIsLoading(false);
			}
		};
		fetchLogs();
	}, [t]);
	return [logs, isLoading, error];
};

const useFetchQueueData = (trigger) => {
	const [jobs, setJobs] = useState(undefined);
	const [metrics, setMetrics] = useState(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);

	useEffect(() => {
		const fetchJobs = async () => {
			try {
				setIsLoading(true);
				const response = await networkService.getQueueData();
				if (response.status === 200) {
					setJobs(response.data.data.jobs);
					setMetrics(response.data.data.metrics);
				}
			} catch (error) {
				setError(error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchJobs();
	}, [trigger]);

	return [jobs, metrics, isLoading, error];
};

const useFlushQueue = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);

	const flushQueue = async (trigger, setTrigger) => {
		try {
			setIsLoading(true);
			await networkService.flushQueue();
			createToast({
				body: "Queue flushed",
			});
		} catch (error) {
			setError(error);
			createToast({
				body: error.message,
			});
		} finally {
			setIsLoading(false);
			setTrigger(!trigger);
		}
	};
	return [flushQueue, isLoading, error];
};

const useFetchDiagnostics = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const [diagnostics, setDiagnostics] = useState(undefined);

	const fetchDiagnostics = async () => {
		try {
			setIsLoading(true);
			const response = await networkService.getDiagnostics();
			setDiagnostics(response.data.data);
		} catch (error) {
			createToast({
				body: error.message,
			});
			setError(error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchDiagnostics();
	}, []);

	return [diagnostics, fetchDiagnostics, isLoading, error];
};

export { useFetchLogs, useFetchQueueData, useFlushQueue, useFetchDiagnostics };
