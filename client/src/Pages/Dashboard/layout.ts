import { GRID_COLUMNS, HALF_WIDTH, type CardDefinition } from "./cards";

export interface PlacedCard {
	card: CardDefinition;
	/** Columns rendered. Equal to the declared width except for a lone half. */
	renderedWidth: number;
}

/**
 * Packs cards into rows of GRID_COLUMNS.
 *
 * With only two widths this is nearly trivial: two halves fill a row exactly
 * and a full-width card fills its own, so no card is ever stretched to close a
 * gap. The one case needing a decision is a half-width card left alone at the
 * end of the page — it is promoted to full width so the page does not end on a
 * ragged half.
 *
 * `grid-auto-flow: dense` was tried and does not help: with a single body width
 * there is never a smaller card available to backfill.
 */
export const layoutCards = (cards: CardDefinition[]): PlacedCard[] => {
	const placed: PlacedCard[] = cards.map((card) => ({
		card,
		renderedWidth: card.width,
	}));

	// Columns occupied in the row still open once every card is placed. A
	// trailing half-width card leaves exactly HALF_WIDTH here.
	const trailing = placed.reduce(
		(used, entry) => (used + entry.renderedWidth) % GRID_COLUMNS,
		0
	);

	const last = placed[placed.length - 1];
	if (last && trailing === HALF_WIDTH) {
		last.renderedWidth = GRID_COLUMNS;
	}

	return placed;
};
