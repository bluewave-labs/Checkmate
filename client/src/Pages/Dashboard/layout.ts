import { GRID_COLUMNS, STRETCH_MAX_WIDTH, type CardDefinition } from "./cards";

export interface PlacedCard {
	card: CardDefinition;
	/** Columns actually rendered — the declared width, or more if stretched. */
	renderedWidth: number;
}

/**
 * Packs cards into rows of GRID_COLUMNS. Declared width is a minimum; when a
 * row ends short, its last card absorbs the remainder.
 *
 * A row in the middle of the page always fills completely — leaving a hole
 * there reads as a rendering fault. Only the final row may end short, and only
 * when a single card sits in it: stretching a lone trailing card to full width
 * makes a 4-column card look like a banner. There, STRETCH_MAX_WIDTH caps the
 * growth instead.
 *
 * `grid-auto-flow: dense` was tried instead and does not help: no later card is
 * small enough to backfill the gaps that occur in practice.
 */
export const layoutCards = (cards: CardDefinition[]): PlacedCard[] => {
	const placed: PlacedCard[] = [];
	let row: PlacedCard[] = [];
	let used = 0;

	const flush = (isFinalRow: boolean) => {
		if (row.length === 0) {
			return;
		}
		const remainder = GRID_COLUMNS - used;
		if (remainder > 0) {
			const last = row[row.length - 1];
			// A lone card ending the page grows only to the cap; every other short
			// row is filled completely so no gap is left mid-page.
			const ceiling = isFinalRow && row.length === 1 ? STRETCH_MAX_WIDTH : GRID_COLUMNS;
			last.renderedWidth = Math.min(last.renderedWidth + remainder, ceiling);
		}
		placed.push(...row);
		row = [];
		used = 0;
	};

	for (const card of cards) {
		if (used + card.width > GRID_COLUMNS) {
			flush(false);
		}
		row.push({ card, renderedWidth: card.width });
		used += card.width;
		if (used === GRID_COLUMNS) {
			flush(false);
		}
	}
	flush(true);

	return placed;
};
