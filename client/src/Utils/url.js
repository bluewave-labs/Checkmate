export const normalizeUrl = (input, useHttps) => {
	const cleaned = input.replace(/^(https?:\/\/)/i, "");
	return `http${useHttps ? "s" : ""}://${cleaned}`;
};

export const validateUrl = (url) => {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
};
