import { useState, useEffect } from "react";
import { networkService } from "../../../../main";
import { useSelector } from "react-redux";
import { createToast } from "../../../../Utils/toastUtils";

const useStatusPagesFetch = () => {
	const { user } = useSelector((state) => state.auth);

	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	const [statusPages, setStatusPages] = useState(undefined);

	useEffect(() => {
		const fetchStatusPages = async () => {
			try {
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
		};
		fetchStatusPages();
	}, [user]);
	return [isLoading, networkError, statusPages];
};

export { useStatusPagesFetch };
