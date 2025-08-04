import { useEffect, useState } from "react";
import { createToast } from "../Utils/toastUtils";

/**
 * Generic reusable hook to fetch data asynchronously.
 *
 * @param {Object} params - Parameters object
 * @param {() => Promise} params.requestFn - Async function that returns the API response (promise)
 * @param {boolean} [params.enabled=true] - Whether the hook should perform fetching
 * @param {boolean} [params.shouldRun=true] - Additional conditional flag to control fetching
 * @param {Array<any>} [params.deps=[]] - Dependencies array to control when the effect reruns
 * @param {(responseData: any) => { data: any, count?: number }} [params.extractFn=null] - Optional function to customize how data and count are extracted from response
 *
 * @returns {[any, number|undefined, boolean, boolean]} Returns an array with:
 *    - data: fetched data or undefined,
 *    - count: total count if applicable or undefined,
 *    - isLoading: boolean loading state,
 *    - networkError: boolean error state
 */
export const useFetchData = ({
	requestFn,
	enabled = true,
	shouldRun = true,
	deps = [],
	extractFn = null,
}) => {
	const [data, setData] = useState(undefined);
	const [count, setCount] = useState(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [networkError, setNetworkError] = useState(false);

	// Reset data if disabled
	useEffect(() => {
		if (!enabled || !shouldRun) {
			setData(undefined);
			setCount(undefined);
		}
	}, [enabled, shouldRun]);

	useEffect(() => {
		let isMounted = true;

		const fetchData = async () => {
			if (!enabled || !shouldRun) return;

			setIsLoading(true);
			setNetworkError(false);

			try {
				const res = await requestFn();
				if (!isMounted) return;

				const responseData = res?.data?.data;

				if (extractFn) {
					const { data: extractedData, count: extractedCount } = extractFn(responseData);
					setData(extractedData);
					setCount(extractedCount ?? undefined);
				} else if (responseData?.checks) {
					setData(responseData.checks);
					setCount(responseData.checksCount ?? 0);
				} else {
					setData(responseData);
					setCount(undefined);
				}
			} catch (error) {
				if (!isMounted) return;
				setNetworkError(true);
				createToast({ body: error.message || "Something went wrong" });
			} finally {
				if (isMounted) setIsLoading(false);
			}
		};

		fetchData();

		return () => {
			isMounted = false;
		};
	}, deps);

	return [data, count, isLoading, networkError];
};
