import { useState, useEffect } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";
import { useTranslation } from "react-i18next";

const useFetchLogs = () => {
	const { t } = useTranslation();
	const [logs, setLogs] = useState(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);

	useEffect(() => {
		const fetchLogs = async () => {
			try {
				setIsLoading(true);
				const response = await networkService.getLogs();
				setLogs(response.data.data);
				createToast({
					body: t("logsPage.toast.fetchLogsSuccess"),
				});
			} catch (error) {
				setError(error);
				createToast({
					message: error.message,
				});
			} finally {
				setIsLoading(false);
			}
		};
		fetchLogs();
	}, [t]);
	return [logs, isLoading, error];
};

export { useFetchLogs };
