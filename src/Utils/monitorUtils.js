import { capitalizeFirstLetter } from "./stringUtils";

/**
 * Helper function to get duration since last check or the last date checked
 * @param {Array} checks Array of check objects.
 * @param {boolean} duration Whether the function should return the duration since last checked or the date itself
 * @returns {number} Timestamp of the most recent check.
 */
export const getLastChecked = (checks, duration = true) => {
	if (!checks || checks.length === 0) {
		return 0; // Handle case when no checks are available
	}

	// Data is sorted newest -> oldest, so newest check is the most recent
	if (!duration) {
		return new Date(checks[0].createdAt);
	}
	return new Date() - new Date(checks[0].createdAt);
};

export const parseDomainName = (url) => {
	url = url.replace(/^https?:\/\//, "");
	// Remove leading/trailing dots
	url = url.replace(/^\.+|\.+$/g, "");
	// Split by dots
	const parts = url.split(".");
	// Remove common prefixes and empty parts and exclude the last element of the array (the last element should be the TLD)
	const cleanParts = parts.filter((part) => part !== "www" && part !== "").slice(0, -1);
	// If there's more than one part, append the two words and capitalize the first letters (e.g. ["api", "test"] -> "Api Test")
	const domainPart =
		cleanParts.length > 1
			? cleanParts.map((part) => capitalizeFirstLetter(part)).join(" ")
			: capitalizeFirstLetter(cleanParts[0]);

	if (domainPart) return domainPart;

	return url;
};
