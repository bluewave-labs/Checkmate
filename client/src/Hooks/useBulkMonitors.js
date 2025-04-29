import { useState } from "react";
import { networkService } from "../main"; // Your network service

export const useBulkMonitors = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const createBulkMonitors = async (file, user) => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("csvFile", file);
    formData.append("userId", user._id);
    formData.append("teamId", user.teamId);

    try {
      const response = await networkService.createBulkMonitors(formData);
      return response.data;
    } catch (err) {
      setError(err?.response?.data?.msg ?? err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createBulkMonitors, isLoading, error };
};
