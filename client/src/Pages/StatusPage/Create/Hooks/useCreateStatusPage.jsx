import { useState } from "react";
import { networkService } from "../../../../main";
import { createToast } from "../../../../Utils/toastUtils";

const useCreateStatusPage = (isCreate, url) => {
	const [isLoading, setIsLoading] = useState(false);
	const [networkError, setNetworkError] = useState(false);
	const createStatusPage = async ({ form }) => {
		setIsLoading(true);
		try {
			await networkService.createStatusPage({ form, isCreate, url });
			return true;
		} catch (error) {
			setNetworkError(true);
			createToast({ body: error?.response?.data?.msg ?? error.message });
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	return [createStatusPage, isLoading, networkError];
};

export { useCreateStatusPage };
