// Multipart forms send the field as `embedAllowedOrigins[]`, which arrives as a
// string for one value and an array for several. Coerce to a trimmed, lowercased,
// deduplicated array; undefined stays undefined so an absent field is left alone.
export const normalizeEmbedAllowedOrigins = (value: unknown): string[] | undefined => {
	if (value === undefined || value === null) {
		return undefined;
	}

	const values = Array.isArray(value) ? value : [value];
	const normalized = values.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim().toLowerCase());

	return [...new Set(normalized.filter((entry) => entry.length > 0))];
};
