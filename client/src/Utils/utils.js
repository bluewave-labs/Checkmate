export const safelyParseFloat = (value) => {
	const parsedValue = parseFloat(value);
	if (isNaN(parsedValue)) {
		return 0;
	}
	return parsedValue;
};

export const formatMonitorUrl = (url, maxLength = 55) => {
	if (!url) return "";
	const strippedUrl = url.replace(/^https?:\/\//, "");
	return strippedUrl.length > maxLength
		? `${strippedUrl.slice(0, maxLength)}…`
		: strippedUrl;
};
