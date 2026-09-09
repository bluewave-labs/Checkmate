import type { CardDefinition } from "./cards";

export interface PlacedCard {
	card: CardDefinition;
	/** Columns rendered — currently always the declared width. */
	renderedWidth: number;
}

/**
 * Packs cards into rows of GRID_COLUMNS.
 *
 * With a single body width this is a straight pass-through: two halves fill a
 * row exactly, so no card is ever stretched to close a gap.
 *
 * An odd number of cards leaves the last one alone on its row. It keeps its
 * declared width rather than being promoted to full: widening one card to fill
 * the row makes it look more important than it is, and an odd count is a
 * property of the selection, not something the layout should hide.
 */
export const layoutCards = (cards: CardDefinition[]): PlacedCard[] =>
	cards.map((card) => ({ card, renderedWidth: card.width }));
