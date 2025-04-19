export const tooltipDateFormatLookup = (dateRange) => {
	const dateFormatLookup = {
		day: "ddd. MMMM D, YYYY, hh:mm A",
		week: "ddd. MMMM D, YYYY, hh:mm A",
		month: "ddd. MMMM D, YYYY",
	};
	const format = dateFormatLookup[dateRange];
	if (format === undefined) {
		return "";
	}
	return format;
};

export const tickDateFormatLookup = (dateRange) => {
	const tickFormatLookup = {
		recent: "h:mm A",
		day: "h:mm A",
		week: "MM/D, h:mm A",
		month: "ddd. M/D",
	};
	const format = tickFormatLookup[dateRange];
	if (format === undefined) {
		return "";
	}
	return format;
};
