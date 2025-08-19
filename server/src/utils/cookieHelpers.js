/**
 * Get standardized cookie options for authentication tokens
 * @param {Object} options - Additional cookie options
 * @returns {Object} Cookie options object
 */
export const getAuthCookieOptions = (options = {}) => {
	return {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: 2 * 60 * 60 * 1000, // 2 hours (matches JWT TTL)
		...options,
	};
};

/**
 * Clear cookie options for authentication tokens
 * @returns {Object} Cookie clear options object
 */
export const getClearAuthCookieOptions = () => {
	return {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
	};
};
