import { useEffect, useState } from "react";
import { createToast } from "../Utils/toastUtils";

export const useFetchData = ({
	requestFn, // API function
	enabled = true,
	deps = [],
	shouldRun = true, // extra check like monitorId/type
}) => {
	const [data, setData] = useState(undefined);
	const [count, setCount] = useState(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [networkError, setNetworkError] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			if (!enabled || !shouldRun) return;

			try {
				setIsLoading(true);
				const res = await requestFn();
				// Support both list and summary
				if (res.data?.data?.checks) {
					setData(res.data.data.checks);
					setCount(res.data.data.checksCount);
				} else {
					setData(res.data.data);
				}
			} catch (error) {
				setNetworkError(true);
				createToast({ body: error.message });
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, deps); // dependencies passed from hook

	return [data, count, isLoading, networkError];
};
