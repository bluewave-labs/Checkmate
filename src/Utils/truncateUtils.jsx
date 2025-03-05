// src/utils/truncateUtils.js
import { isEmpty } from "./stringUtils";

/**
 * Utility function to render a truncated value with an optional title.
 * @param {string} displayName - The name or text to display.
 * @param {number} maxLength - The maximum length of the text.
 * @param {string} placeholder - Placeholder text if no value is provided.
 * @returns {JSX.Element} - The JSX element for the rendered value.
 *
 */

const truncateTextWithDottedEnds = function (text, maxLength) {
	if (!text || text.length <= maxLength) return text;
	return `${text.substring(0, maxLength)}...`;
};

export const renderTruncatedValue = function (
	displayName,
	truncate,
	maxLength,
	placeholder
) {
	if (isEmpty(displayName)) return placeholder;

	return truncate ? (
		<span title={displayName}>{truncateTextWithDottedEnds(displayName, maxLength)}</span>
	) : (
		<span title={displayName}>{displayName}</span>
	);
};
