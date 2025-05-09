import { useSelector } from "react-redux";
import { useState } from "react";
import { networkService } from "../../../../main";
import { useTranslation } from "react-i18next";
import { createToast } from "../../../../Utils/toastUtils";

const useStatusPageDelete = (fetchStatusPage, url) => {
	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation();
	const deleteStatusPage = async () => {
		try {
			setIsLoading(true);
			await networkService.deleteStatusPage({ url });
			fetchStatusPage?.();
			return true;
		} catch (error) {
			createToast({
				body: t("failedToDeleteStatusPage"),
			});
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	return [deleteStatusPage, isLoading];
};

export { useStatusPageDelete };
