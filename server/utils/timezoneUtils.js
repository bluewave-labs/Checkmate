/**
 * Formats a timestamp in the user's timezone
 * @param {number|Date} timestamp - The timestamp to format
 * @param {string} timezone - The timezone to format in (e.g., "America/Toronto")
 * @returns {string} Formatted timestamp with timezone abbreviation
 */
export const formatTimestampInTimezone = (timestamp, timezone) => {
	const date = new Date(timestamp);

	// Format the date with the user's timezone
	const formattedDate = date.toLocaleString("en-US", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
		timeZone: timezone,
	});

	// Get timezone abbreviation
	const timeZoneAbbr = date
		.toLocaleTimeString("en-US", {
			timeZoneName: "short",
			timeZone: timezone,
		})
		.split(" ")
		.pop();

	// Format the date with readable format
	return (
		formattedDate.replace(/(\d+)\/(\d+)\/(\d+),\s/, "$3-$1-$2 ") + " " + timeZoneAbbr
	);
};
