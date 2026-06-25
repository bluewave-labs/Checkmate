export const normalizeStatusPageDomain = (value?: string | null): string | null => {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim().toLowerCase();
	if (!trimmed) {
		return null;
	}

	// Strip scheme, path, and port if a full URL was pasted.
	const withoutScheme = trimmed.replace(/^https?:\/\//, "");
	const hostname = withoutScheme.split("/")[0]?.split(":")[0] ?? "";

	return hostname || null;
};

export const resolveStatusPageDomainFromRequest = (hostHeader?: string | null, queryDomain?: string | null): string | null => {
	const fromQuery = normalizeStatusPageDomain(queryDomain);
	if (fromQuery) {
		return fromQuery;
	}

	if (!hostHeader) {
		return null;
	}

	return normalizeStatusPageDomain(hostHeader.split(":")[0]);
};
