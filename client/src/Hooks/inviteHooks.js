import { useState } from "react";
import { networkService } from "../main";
import { useTranslation } from "react-i18next";

const CLIENT_HOST = import.meta.env.VITE_APP_CLIENT_HOST;

const useGetInviteToken = () => {
	const { t } = useTranslation();

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const [token, setToken] = useState(undefined);

	const clearToken = () => {
		setToken(undefined);
	};
	const fetchToken = async (email, role) => {
		const response = await networkService.requestInvitationToken({ email, role });
		const token = response?.data?.data?.token;
		if (typeof token === "undefined") {
			throw new Error(t("inviteNoTokenFound"));
		}
		return token;
	};
	const getInviteToken = async ({ email, role }) => {
		try {
			setIsLoading(true);
			const token = await fetchToken(email, role);
			let inviteLink = token;

			if (typeof CLIENT_HOST !== "undefined") {
				inviteLink = `${CLIENT_HOST}/register/${token}`;
			}
			setToken(inviteLink);
			return token;
		} catch (error) {
			setError(error);
		} finally {
			setIsLoading(false);
		}
	};

	const addTeamMember = async (formData, role) => {
		try {
			setIsLoading(true);
			const token = await fetchToken(formData.email, role);
			const toSubmit = {
				...formData,
				inviteToken: token,
			};
			delete toSubmit.confirm;
			const responseRegister = await networkService.registerUser(toSubmit);
			return responseRegister;
		} catch (error) {
			setError(error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	return [getInviteToken, clearToken, isLoading, error, token, addTeamMember];
};

export { useGetInviteToken };
