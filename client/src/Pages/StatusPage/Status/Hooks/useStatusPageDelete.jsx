import { useSelector } from "react-redux";
import { useState } from "react";
import { networkService } from "../../../../main";
import { createToast } from "../../../../Utils/toastUtils";
import { useTranslation } from "react-i18next";

const useStatusPageDelete = (fetchStatusPage, url) => {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const deleteStatusPage = async () => {
		try {
			setIsLoading(true);
			await networkService.deleteStatusPage({ url });
			fetchStatusPage?.();
			// optional
			createToast({
				body: t('statusPage.deletedSuccessfully'),
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
