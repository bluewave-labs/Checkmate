import { useState } from "react";
import { networkService } from "../../../../main";
import { useSelector } from "react-redux";
import { createToast } from "../../../../Utils/toastUtils";

const useCreateDistributedUptimeMonitor = ({ isCreate, monitorId }) => {
	const { authToken, user } = useSelector((state) => state.auth);

	const [isLoading, setIsLoading] = useState(false);
	const [networkError, setNetworkError] = useState(false);
	const createDistributedUptimeMonitor = async ({ form }) => {
		setIsLoading(true);
		try {
			if (isCreate) {
				await networkService.createMonitor({ authToken, monitor: form });
			} else {
				await networkService.updateMonitor({ authToken, monitor: form, monitorId });
			}

			return true;
		} catch (error) {
			setNetworkError(true);
			createToast({ body: error?.response?.data?.msg ?? error.message });
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	return [createDistributedUptimeMonitor, isLoading, networkError];
};

export { useCreateDistributedUptimeMonitor };
