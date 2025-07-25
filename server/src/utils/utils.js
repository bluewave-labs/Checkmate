/**
 * Converts a request body parameter to a boolean.
 * @param {string | boolean} value
 * @returns {boolean}
 */
const ParseBoolean = (value) => {
	if (value === true || value === "true") {
		return true;
	} else if (value === false || value === "false" || value === null || value === undefined) {
		return false;
	}
};

const getTokenFromHeaders = (headers) => {
	const authorizationHeader = headers.authorization;
	if (!authorizationHeader) throw new Error("No auth headers");

	const parts = authorizationHeader.split(" ");
	if (parts.length !== 2 || parts[0] !== "Bearer") throw new Error("Invalid auth headers");

	return parts[1];
};

export { ParseBoolean, getTokenFromHeaders };
