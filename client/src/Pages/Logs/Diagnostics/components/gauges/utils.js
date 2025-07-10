export const getPercentage = (value, total) => {
	if (!value || !total) return 0;
	return (value / total) * 100;
};
