import { useSelector } from "react-redux";
import { useState } from "react";
import { networkService } from "../../../../main";
import { createToast } from "../../../../Utils/toastUtils";

const useStatusPageDelete = (fetchStatusPage, url) => {
	const [isLoading, setIsLoading] = useState(false);
	const { authToken } = useSelector((state) => state.auth);
	const deleteStatusPage = async () => {
		try {
			setIsLoading(true);
			await networkService.deleteStatusPage({ authToken, url });
			fetchStatusPage?.();
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

	return [deleteStatusPage, isLoading];
};

export { useStatusPageDelete };
