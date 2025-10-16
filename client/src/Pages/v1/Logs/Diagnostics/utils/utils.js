export const getPercentage = (value, total) => {
	if (!value || !total) return 0;
	return (value / total) * 100;
};

export const formatBytes = (bytes) => {
	if (!bytes) return "N/A";

	if (bytes === 0) return "0 Bytes";

	if (bytes >= 1024 * 1024 * 1024) {
		return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
	}

	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
