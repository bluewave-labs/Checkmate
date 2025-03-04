import PropTypes from "prop-types";
import { isEmpty } from "../stringUtils";

/**
 * Utility function to render a truncated value with an optional title.
 * @param {string} displayName - The name or text to display.
 * @param {boolean} truncate - Whether to truncate the text or not.
 * @param {number} maxLength - The maximum length of the text.
 * @param {string} placeholder - Placeholder text if no value is provided.
 * @returns {JSX.Element} - The JSX element for the rendered value.
 */

export const renderTruncatedValue = function (
	displayName,
	truncate,
	maxLength,
	placeholder
) {
	if (isEmpty(displayName)) return placeholder;

	const truncateTextWithDottedEnds = function (text, maxLength) {
		if (!text || text.length <= maxLength) return text;
		return `${text.substring(0, maxLength)}...`;
	};

	return truncate ? (
		<span title={displayName}>{truncateTextWithDottedEnds(displayName, maxLength)}</span>
	) : (
		<span title={displayName}>{displayName}</span>
	);
};

renderTruncatedValue.propTypes = {
	displayName: PropTypes.string, // The name or text to display
	truncate: PropTypes.bool, // Whether to truncate the text or not
	maxLength: PropTypes.number, // The maximum length of the text
	placeholder: PropTypes.string, // Placeholder text if no value is provided
};
