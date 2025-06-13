import { useState } from "react";
import { networkService } from "../main";

export const useBulkMonitors = () => {
	const [isLoading, setIsLoading] = useState(false);

	const createBulkMonitors = async (file, user) => {
		setIsLoading(true);

		const formData = new FormData();
		formData.append("csvFile", file);

		try {
			const response = await networkService.createBulkMonitors(formData);
			return [true, response.data, null]; // [success, data, error]
		} catch (err) {
			const errorMessage = err?.response?.data?.msg || err.message;
			return [false, null, errorMessage];
		} finally {
			setIsLoading(false);
		}
	};

	return [createBulkMonitors, isLoading];
};
