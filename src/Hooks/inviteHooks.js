import { useState } from "react";
import { networkService } from "../main";
import { useTranslation } from "react-i18next";

const CLIENT_HOST = import.meta.env.VITE_CLIENT_HOST;

const useGetInviteToken = () => {
	const { t } = useTranslation();

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const [token, setToken] = useState(undefined);

	const clearToken = () => {
		setToken(undefined);
	};

	const getInviteToken = async ({ email, role }) => {
		try {
			const response = await networkService.requestInvitationToken({
				email,
				role,
			});
			const token = response?.data?.data?.token;
			if (typeof token === "undefined") {
				throw new Error(t("inviteNoTokenFound"));
			}

			let inviteLink = token;

			if (typeof CLIENT_HOST !== "undefined") {
				inviteLink = `${CLIENT_HOST}/register/${token}`;
			}

			setToken(inviteLink);
		} catch (error) {
			setError(error);
		} finally {
			setIsLoading(false);
		}
	};

	return [getInviteToken, clearToken, isLoading, error, token];
};

export { useGetInviteToken };
