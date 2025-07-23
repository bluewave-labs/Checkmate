import { useEffect, useState, useCallback } from "react";
import { networkService } from "../main";
import { createToast } from "../Utils/toastUtils";
import { useTranslation } from "react-i18next";

export const useGetUser = (userId) => {
	const [user, setUser] = useState(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	const fetchUser = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await networkService.getUserById({ userId });
			setUser(response?.data?.data);
		} catch (error) {
			createToast({
				body: error.message,
			});
			setError(error);
		} finally {
			setIsLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		if (userId) {
			fetchUser();
		}
	}, [userId, fetchUser]);

	return [user, isLoading, error];
};

export const useEditUser = (userId) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const { t } = useTranslation();

	const editUser = useCallback(
		async (user) => {
			try {
				setIsLoading(true);
				await networkService.editUser({ userId, user });
				createToast({
					body: t("editUserPage.toast.successUserUpdate"),
				});
			} catch (error) {
				createToast({
					body: error.message,
				});
				setError(error);
			} finally {
				setIsLoading(false);
			}
		},
		[userId]
	);

	return [editUser, isLoading, error];
};
