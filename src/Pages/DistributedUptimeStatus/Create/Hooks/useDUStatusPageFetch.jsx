import { useEffect, useState, useCallback } from "react";
import { networkService } from "../../../../main";
import { useSelector } from "react-redux";
import { createToast } from "../../../../Utils/toastUtils";

const useDUStatusPageFetch = (isCreate = false, url) => {
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	const [statusPage, setStatusPage] = useState(undefined);
	const { authToken } = useSelector((state) => state.auth);
	const fetchStatusPage = useCallback(async () => {
		try {
			const response = await networkService.getStatusPageByUrl({
				authToken,
				url,
				type: "distributed",
			});

			if (!response?.data?.data) return;

			const statusPage = response.data.data;
			setStatusPage(statusPage);
		} catch (error) {
			// If there is a 404, status page is not found
			if (error?.response?.status === 404) {
				setStatusPage(undefined);
				return;
			}
			createToast({ body: error.message });
			setNetworkError(true);
		} finally {
			setIsLoading(false);
		}
	}, [authToken, url]);

	useEffect(() => {
		if (isCreate === true) {
			return;
		}
		fetchStatusPage();
	}, [isCreate, fetchStatusPage]);

	return [statusPage, isLoading, networkError, fetchStatusPage];
};

export { useDUStatusPageFetch };
