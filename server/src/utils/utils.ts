export const ParseBoolean = (value: boolean | string | null | undefined) => {
	if (value === true || value === "true") {
		return true;
	} else if (value === false || value === "false" || value === null || value === undefined) {
		return false;
	}
};

export const getTokenFromHeaders = (headers: Record<string, string>) => {
	const authorizationHeader = headers.authorization;
	if (!authorizationHeader) throw new Error("No auth headers");

	const parts = authorizationHeader.split(" ");
	if (parts.length !== 2 || parts[0] !== "Bearer") throw new Error("Invalid auth headers");

	return parts[1];
};
