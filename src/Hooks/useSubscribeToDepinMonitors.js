import { useEffect, useState } from "react";
import { networkService } from "../main";
import { useSelector } from "react-redux";
import { useTheme } from "@emotion/react";
import { useMonitorUtils } from "./useMonitorUtils";
import { createToast } from "../Utils/toastUtils";

const useSubscribeToDepinMonitors = (page, rowsPerPage) => {
	// Redux
	const { user } = useSelector((state) => state.auth);

	// Local state
	const [isLoading, setIsLoading] = useState(true);
	const [networkError, setNetworkError] = useState(false);
	const [count, setCount] = useState(undefined);
	const [monitors, setMonitors] = useState(undefined);

	const theme = useTheme();
	const { getMonitorWithPercentage } = useMonitorUtils();

	useEffect(() => {
		const fetchInitialData = async () => {
			try {
				const initialDataRes = await networkService.getDistributedUptimeMonitors({
					teamId: user.teamId,
					limit: 25,
					types: ["distributed_http"],
					page,
					rowsPerPage,
				});

				const { count, monitors } = initialDataRes?.data?.data ?? {};
				const responseData = initialDataRes?.data?.data;
				if (typeof responseData === "undefined") throw new Error("No data");

				const mappedMonitors = monitors?.map((monitor) =>
					getMonitorWithPercentage(monitor, theme)
				);

				setMonitors(mappedMonitors);
				setCount(count?.monitorsCount ?? 0);
			} catch (error) {
				setNetworkError(true);
				createToast({
					body: error.message,
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchInitialData();

		try {
			const cleanup = networkService.subscribeToDistributedUptimeMonitors({
				teamId: user.teamId,
				limit: 25,
				types: [
					typeof import.meta.env.VITE_DEPIN_TESTING === "undefined"
						? "distributed_http"
						: "distributed_test",
				],
				page,
				rowsPerPage,
				filter: null,
				field: null,
				order: null,
				onUpdate: (data) => {
					if (isLoading === true) {
						setIsLoading(false);
					}
					const { count, monitors } = data;
					const mappedMonitors = monitors.map((monitor) =>
						getMonitorWithPercentage(monitor, theme)
					);
					setMonitors(mappedMonitors);
					setCount(count?.monitorsCount ?? 0);
				},
				onError: () => {
					setIsLoading(false);
				},
			});

			return cleanup;
		} catch (error) {
			createToast({
				body: error.message,
			});
			setNetworkError(true);
		}
	}, [user, getMonitorWithPercentage, theme, isLoading, page, rowsPerPage]);
	return [monitors, count, isLoading, networkError];
};
export { useSubscribeToDepinMonitors };
