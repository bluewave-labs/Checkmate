import { useState } from "react";
import { networkService } from "../../../../main";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { createToast } from "../../../../Utils/toastUtils";

const useCreateStatusPage = (isCreate, url) => {
	const { user } = useSelector((state) => state.auth);
	const { t } = useTranslation();

	const [isLoading, setIsLoading] = useState(false);
	const [networkError, setNetworkError] = useState(false);
	const createStatusPage = async ({ form }) => {
		setIsLoading(true);
		try {
			await networkService.createStatusPage({ user, form, isCreate, url });
			return true;
		} catch (error) {
			setNetworkError(true);
			createToast({ body: error?.response?.data?.msg ?? t("failedToCreateStatusPage") });
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	return [createStatusPage, isLoading, networkError];
};

export { useCreateStatusPage };
