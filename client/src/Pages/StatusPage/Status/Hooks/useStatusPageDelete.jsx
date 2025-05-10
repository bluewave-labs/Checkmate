import { useSelector } from "react-redux";
import { useState } from "react";
import { networkService } from "../../../../main";
import { createToast } from "../../../../Utils/toastUtils";

const useStatusPageDelete = (fetchStatusPage, url) => {
	const [isLoading, setIsLoading] = useState(false);
	const deleteStatusPage = async () => {
		try {
			setIsLoading(true);
			await networkService.deleteStatusPage({ url });
			fetchStatusPage?.();
			// optional
			createToast({
				body: "Status page deleted successfully.",
			});
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
