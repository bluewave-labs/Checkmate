import { useSelector } from "react-redux";
import { useState } from "react";
import { networkService } from "../../../../main";
import { createToast } from "../../../../Utils/toastUtils";

const useDeleteMonitor = ({ monitorId }) => {
	const [isLoading, setIsLoading] = useState(false);
	const { authToken } = useSelector((state) => state.auth);
	const deleteMonitor = async () => {
		try {
			setIsLoading(true);
			await networkService.deleteMonitorById({ authToken, monitorId });
			return true;
		} catch (error) {
			createToast({
				body: error.message,
			});
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	return [deleteMonitor, isLoading];
};

export { useDeleteMonitor };
