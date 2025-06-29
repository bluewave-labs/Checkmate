import { useState } from "react";
import { networkService } from "../../../../Utils/NetworkService";
import { createToast } from "../../../../Utils/toastUtils";
import { useTranslation } from "react-i18next";

/**
 * Hook for deleting a status page with optimistic UI update
 * @param {Function} fetchStatusPage - Function to fetch status page data
 * @param {string} url - URL of the status page
 * @returns {Array} - [deleteStatusPage function, isLoading state]
 */
const useStatusPageDelete = (fetchStatusPage, url) => {
	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation();

	/**
	 * Delete a status page with optimistic UI update
	 * @returns {Promise<boolean>} - Success status
	 */
	const deleteStatusPage = async () => {
		// We don't need to call fetchStatusPage after deletion
		// This prevents the 404 error when trying to fetch a deleted status page
		try {
			setIsLoading(true);
			await networkService.deleteStatusPage({ url });
			createToast({
				body: t("statusPage.deleteSuccess", "Status page deleted successfully"),
			});
			return true;
		} catch (error) {
			createToast({
				body: t("statusPage.deleteFailed", "Failed to delete status page"),
			});
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	return [deleteStatusPage, isLoading];
};

export { useStatusPageDelete };
