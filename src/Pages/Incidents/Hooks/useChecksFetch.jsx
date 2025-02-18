import { useState, useEffect } from "react";
import { networkService } from "../../../main";
import { createToast } from "../../../Utils/toastUtils";
import { useSelector } from "react-redux";
const useChecksFetch = ({ selectedMonitor, filter, dateRange, page, rowsPerPage }) => {
	//Redux
	const { authToken, user } = useSelector((state) => state.auth);

	//Local
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	const [checks, setChecks] = useState(undefined);
	const [checksCount, setChecksCount] = useState(undefined);

	useEffect(() => {
		const fetchChecks = async () => {
			try {
				setIsLoading(true);
				let res;

				if (selectedMonitor === "0") {
					res = await networkService.getChecksByTeam({
						authToken: authToken,
						status: false,
						teamId: user.teamId,
						sortOrder: "desc",
						limit: null,
						dateRange,
						filter: filter,
						page: page,
						rowsPerPage: rowsPerPage,
					});
				} else {
					res = await networkService.getChecksByMonitor({
						authToken: authToken,
						status: false,
						monitorId: selectedMonitor,
						sortOrder: "desc",
						limit: null,
						dateRange,
						filter: filter,
						page,
						rowsPerPage,
					});
				}
				setChecks(res.data.data.checks);
				setChecksCount(res.data.data.checksCount);
			} catch (error) {
				setNetworkError(true);
				createToast({ body: error.message });
			} finally {
				setIsLoading(false);
			}
		};
		fetchChecks();
	}, [authToken, user, dateRange, page, rowsPerPage, filter, selectedMonitor]);
	return { isLoading, networkError, checks, checksCount };
};

export default useChecksFetch;
