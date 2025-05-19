import { useState } from "react";
import { networkService } from "../main";
import { useSelector } from "react-redux";
import { createToast } from "../Utils/toastUtils";
import { useTranslation } from "react-i18next";

const useSendTestEmail = () => {
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState(null);
	const user = useSelector((state) => state.auth.user);
	const { t } = useTranslation();

	const sendTestEmail = async () => {
		try {
			setIsSending(true);
			setError(null);

			const response = await networkService.sendTestEmail({ to: user.email });
			if (typeof response?.data?.data?.messageId !== "undefined") {
				createToast({
					body: t("emailSent"),
				});
			} else {
				throw new Error(t("failedToSendEmail"));
			}
		} catch (error) {
			createToast({
				body: t("failedToSendEmail"),
			});
			setError(error);
		} finally {
			setIsSending(false);
		}
	};
	return [isSending, error, sendTestEmail];
};

export { useSendTestEmail };
