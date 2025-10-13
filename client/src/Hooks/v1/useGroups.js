import { useState, useEffect } from "react";
import { networkService } from "../../main.jsx";
import { createToast } from "../../Utils/toastUtils.jsx";

/**
 * Custom hook to fetch groups for a team
 * @returns {Array} [groups, isLoading, error]
 */
export const useGetGroupsByTeamId = () => {
	const [groups, setGroups] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchGroups = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const response = await networkService.getGroupsByTeamId();
				setGroups(response?.data?.data || []);
			} catch (err) {
				console.error("Error fetching groups:", err);
				setError(err.message);
				createToast({
					body: "Failed to load monitor groups",
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchGroups();
	}, []);

	return [groups, isLoading, error];
};