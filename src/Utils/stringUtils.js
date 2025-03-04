/**
 * Helper function to get first letter capitalized string
 * @param {string} str String whose first letter is to be capitalized
 * @returns A string with first letter capitalized
 */
export const capitalizeFirstLetter = (str) => {
	if (str === null || str === undefined) {
		return "";
	}
	if (typeof str !== "string") {
		throw new TypeError("Input must be a string");
	}
	if (str.length === 0) {
		return "";
	}
	return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Helper function to get first letter as a lower case string
 * @param {string} str String whose first letter is to be lower cased
 * @returns A string with first letter lower cased
 */

export const toLowerCaseFirstLetter = (str) => {
	if (str === null || str === undefined) {
		return "";
	}
	if (typeof str !== "string") {
		throw new TypeError("Input must be a string");
	}
	if (str.length === 0) {
		return "";
	}
	return str.charAt(0).toLowerCase() + str.slice(1);
};

/**
 * Checks if a string is null, undefined, or empty (including strings with only whitespace).
 * @param {string} str - The string to check.
 * @returns {boolean} - Returns true if the string is null, undefined, or empty.
 */
export const isEmpty = (str) => {
	// Check if string is null, undefined, or empty (including whitespace only)
	return str === null || str === undefined || str.trim().length === 0;
};

/**
 * Checks if a string is not null, undefined, and not empty (including strings with only whitespace).
 * @param {string} str - The string to check.
 * @returns {boolean} - Returns true if the string is not null, undefined, and not empty.
 */
export const isNotEmpty = (str) => {
	return !isEmpty(str);
};
