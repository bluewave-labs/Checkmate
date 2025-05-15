import { useState } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";

const usePauseMonitor = ({ monitorId, triggerUpdate }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const pauseMonitor = async () => {
		try {
			setIsLoading(true);
			const res = await networkService.pauseMonitorById({ monitorId });
			createToast({
				body: res.data.data.isActive
					? "Monitor resumed successfully"
					: "Monitor paused successfully",
			});
			triggerUpdate();
		} catch (error) {
			setError(error);
		} finally {
			setIsLoading(false);
		}
	};

	return [pauseMonitor, isLoading, error];
};

export { usePauseMonitor };
