export const normalizeUrl = (input, useHttps) => {
	const raw = String(input ?? "").trim();
	const cleaned = raw.replace(/^(?:https?:)?\/\//i, "");
	return `http${useHttps ? "s" : ""}://${cleaned}`;
};

export const validateUrl = (url) => {
	if (typeof url !== "string" || !url.trim()) return false;
	try {
		const u = new URL(url.trim());
		return u.protocol === "http:" || u.protocol === "https:";
	} catch {
		return false;
	}
};
