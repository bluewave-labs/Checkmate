import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { getUptimeMonitorById } from "../Features/UptimeMonitors/uptimeMonitorsSlice";
import { useNavigate } from "react-router";

const useFetchUptimeMonitorById = (monitorId, updateTrigger) => {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [monitor, setMonitor] = useState(null);
	const navigate = useNavigate();
	const dispatch = useDispatch();
	useEffect(() => {
		const fetchMonitor = async () => {
			try {
				setIsLoading(true);
				const action = await dispatch(getUptimeMonitorById({ monitorId }));

				if (getUptimeMonitorById.fulfilled.match(action)) {
					const monitor = action.payload.data;
					setMonitor(monitor);
				} else if (getUptimeMonitorById.rejected.match(action)) {
					throw new Error(action.error.message);
				}
			} catch (error) {
				navigate("/not-found", { replace: true });
			} finally {
				setIsLoading(false);
			}
		};
		fetchMonitor();
	}, [monitorId, dispatch, navigate, updateTrigger]);
	return [monitor, isLoading, error];
};

export { useFetchUptimeMonitorById };
