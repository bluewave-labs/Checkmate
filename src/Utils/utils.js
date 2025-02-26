export const safelyParseFloat = (value) => {
	const parsedValue = parseFloat(value);
	if (isNaN(parsedValue)) {
		return 0;
	}
	return parsedValue;
};
