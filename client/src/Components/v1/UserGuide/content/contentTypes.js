// Content block types for the templatic article system

/**
 * @typedef {'heading' | 'paragraph' | 'callout' | 'bullet-list' | 'ordered-list' | 'checklist' | 'icon-cards' | 'grid-cards' | 'time-estimate' | 'info-box' | 'code' | 'requirements' | 'table' | 'image' | 'article-links'} ContentBlockType
 */

/**
 * @typedef {Object} HeadingBlock
 * @property {'heading'} type
 * @property {string} id - Used for TOC anchors
 * @property {2 | 3} level - h2 or h3
 * @property {string} text
 */

/**
 * @typedef {Object} ParagraphBlock
 * @property {'paragraph'} type
 * @property {string} text - Supports basic markdown: **bold**, *italic*, `code`
 */

/**
 * @typedef {Object} CalloutBlock
 * @property {'callout'} type
 * @property {'info' | 'tip' | 'warning' | 'success'} [variant]
 * @property {string} [title]
 * @property {string} text
 */

/**
 * @typedef {Object} ListItem
 * @property {string} text
 * @property {string} [bold] - Optional bold prefix
 */

/**
 * @typedef {Object} BulletListBlock
 * @property {'bullet-list'} type
 * @property {ListItem[]} items
 */

/**
 * @typedef {Object} OrderedListBlock
 * @property {'ordered-list'} type
 * @property {ListItem[]} items
 */

/**
 * @typedef {Object} ChecklistBlock
 * @property {'checklist'} type
 * @property {string[]} items
 */

/**
 * @typedef {Object} IconCardItem
 * @property {string} icon - Icon name from lucide-react
 * @property {string} title
 * @property {string} description
 */

/**
 * @typedef {Object} IconCardsBlock
 * @property {'icon-cards'} type
 * @property {IconCardItem[]} items
 */

/**
 * @typedef {Object} GridCardItem
 * @property {string} title
 * @property {string} description
 * @property {string} [icon]
 */

/**
 * @typedef {Object} GridCardsBlock
 * @property {'grid-cards'} type
 * @property {GridCardItem[]} items
 * @property {number} [columns]
 */

/**
 * @typedef {Object} TimeEstimateBlock
 * @property {'time-estimate'} type
 * @property {string} text
 */

/**
 * @typedef {Object} InfoBoxBlock
 * @property {'info-box'} type
 * @property {string} [icon]
 * @property {string} title
 * @property {string[]} items
 */

/**
 * @typedef {Object} CodeBlock
 * @property {'code'} type
 * @property {string} code
 * @property {string} [language]
 */

/**
 * @typedef {Object} RequirementItem
 * @property {string} icon
 * @property {string} title
 * @property {string[]} items
 */

/**
 * @typedef {Object} RequirementsBlock
 * @property {'requirements'} type
 * @property {RequirementItem[]} items
 */

/**
 * @typedef {Object} TableColumn
 * @property {string} key
 * @property {string} label
 * @property {string} [width]
 */

/**
 * @typedef {Object} TableBlock
 * @property {'table'} type
 * @property {TableColumn[]} columns
 * @property {Object[]} rows
 */

/**
 * @typedef {Object} ImageBlock
 * @property {'image'} type
 * @property {string} src
 * @property {string} alt
 * @property {string} [caption]
 */

/**
 * @typedef {Object} ArticleLink
 * @property {string} collectionId
 * @property {string} articleId
 * @property {string} title
 * @property {string} [description]
 */

/**
 * @typedef {Object} ArticleLinksBlock
 * @property {'article-links'} type
 * @property {string} [title] - e.g., "Next steps", "Related articles"
 * @property {ArticleLink[]} items
 */

/**
 * @typedef {Object} ArticleContent
 * @property {ContentBlock[]} blocks
 */

/**
 * @typedef {Object} TocItem
 * @property {string} label
 * @property {string} href
 * @property {number} level
 */

/**
 * Helper to extract TOC from content blocks
 * @param {ContentBlock[]} blocks
 * @returns {TocItem[]}
 */
export const extractToc = (blocks) => {
	return blocks
		.filter((block) => block.type === "heading")
		.map((block) => ({
			label: block.text,
			href: `#${block.id}`,
			level: block.level,
		}));
};
