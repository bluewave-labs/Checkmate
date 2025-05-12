import { useState } from "react";
import { networkService } from "../main";
import { useSelector } from "react-redux";
import { createToast } from "../Utils/toastUtils";

const useSendTestEmail = () => {
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState(null);
	const user = useSelector((state) => state.auth.user);

	const sendTestEmail = async () => {
		try {
			setIsSending(true);
			setError(null);

			const response = await networkService.sendTestEmail({ to: user.email });
			if (typeof response?.data?.data?.messageId !== "undefined") {
				createToast({
					body: "Test email sent successfully",
				});
			} else {
				throw new Error("Failed to send test email");
			}
		} catch (error) {
			setError(error);
		} finally {
			setIsSending(false);
		}
	};
	return [isSending, error, sendTestEmail];
};

export { useSendTestEmail };
