import { useState, useEffect } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";

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

export { useFetchQueueData, useFlushQueue };
