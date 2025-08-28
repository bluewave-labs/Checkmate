import { useState, useEffect, useCallback } from "react";
import { networkService } from "../../../../main";
import { useSelector } from "react-redux";
import { createToast } from "../../../../Utils/toastUtils";

const useStatusPagesFetch = () => {
	const { user } = useSelector((state) => state.auth);

	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	const [statusPages, setStatusPages] = useState(undefined);

	const fetchStatusPages = useCallback(async () => {
		try {
			setIsLoading(true);
			setNetworkError(false);
			const res = await networkService.getStatusPagesByTeamId();
			setStatusPages(res?.data?.data);
		} catch (error) {
			setNetworkError(true);
			createToast({
				body: error.message,
			});
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchStatusPages();
	}, [user, fetchStatusPages]);

	return [isLoading, networkError, statusPages, fetchStatusPages];
};

export { useStatusPagesFetch };
