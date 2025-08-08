export const normalizeUrl = (input, useHttps) => {
	const raw = String(input ?? "").trim();
	const cleaned = raw.replace(/^(?:https?:)?\/\//i, "");
	return `http${useHttps ? "s" : ""}://${cleaned}`;
};
