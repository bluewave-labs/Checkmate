import { useState } from "react";
import { networkService } from "../../../../main.jsx";
import { createToast } from "../../../../Utils/toastUtils.jsx";

const useCreateStatusPage = (isCreate) => {
	const [isLoading, setIsLoading] = useState(false);
	const [networkError, setNetworkError] = useState(false);
	const createStatusPage = async ({ form, id }) => {
		console.log(id);
		setIsLoading(true);
		try {
			await networkService.createStatusPage({ form, isCreate, id });
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
