/**
 * Utility function to render a truncated value with an optional title.
 * @param {string} value - The selected value (But this will always come as id).
 * @param {array} items - The list of items to find the selected value from.
 * @param {boolean} truncate - Whether to truncate the text or not.
 * @param {number} maxLength - The maximum length of the text.
 * @param {string} placeholder - Placeholder text if no value is selected.
 * @returns {JSX.Element} - The JSX element for the rendered value.
 */

export const renderTruncatedValue = (displayName, truncate, maxLength, placeholder) => {
	// If no value or the value is '0', return the placeholder
	if (!displayName || displayName === "0") return placeholder;

	// Function to truncate the text with a dotted end
	const truncateTextWithDottedEnds = (text, maxLength) => {
		if (!text || text.length <= maxLength) return text;
		return `${text.substring(0, maxLength)}...`;
	};

	// If truncation is enabled, return the truncated text with a title for full value
	return truncate ? (
		<span title={displayName}>{truncateTextWithDottedEnds(displayName, maxLength)}</span>
	) : (
		displayName
	);
};
