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

	/**
	 * Send a test email with optional email configuration
	 * @param {Object} emailConfig - Optional email configuration parameters
	 */
	const sendTestEmail = async (emailConfig = null) => {
		try {
			setIsSending(true);
			setError(null);

			// Send the test email with or without configuration
			const response = await networkService.sendTestEmail({
				to: user.email,
				emailConfig,
			});

			if (typeof response?.data?.data?.messageId !== "undefined") {
				createToast({
					body: t("settingsTestEmailSuccess", "Test email sent successfully"),
				});
			} else {
				throw new Error(
					response?.data?.error ||
						t("settingsTestEmailFailed", "Failed to send test email")
				);
			}
		} catch (error) {
			createToast({
				body: t("failedToSendEmail"),
			});
			setError(error);
			createToast({
				body: t(
					"settingsTestEmailFailedWithReason",
					"Failed to send test email: {{reason}}",
					{
						reason: error.message || t("settingsTestEmailUnknownError", "Unknown error"),
					}
				),
				variant: "error",
			});
		} finally {
			setIsSending(false);
		}
	};
	return [isSending, error, sendTestEmail];
};

export { useSendTestEmail };
