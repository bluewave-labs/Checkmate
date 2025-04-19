function extractThemeColors(themeType, colorObject) {
	if (!["light", "dark"].includes(themeType)) {
		throw new Error('Invalid theme type. Use "light" or "dark".');
	}

	const extract = (obj) => {
		if (typeof obj !== "object" || obj === null) {
			return obj;
		}

		if ("light" in obj && "dark" in obj) {
			// CAIO_REVIEW:  This will break if the root object has light and dark properties
			return obj[themeType]; // Return the value for the specified theme
		}

		// Reduce the object, keeping only the extracted themeType values
		return Object.keys(obj).reduce((acc, key) => {
			acc[key] = extract(obj[key]);
			return acc;
		}, {});
	};
	return extract(colorObject);
}

export { extractThemeColors };
