import { GRID_COLUMNS, STRETCH_MAX_WIDTH, type CardDefinition } from "./cards";

export interface PlacedCard {
	card: CardDefinition;
	/** Columns actually rendered — the declared width, or more if stretched. */
	renderedWidth: number;
}

/**
 * Packs cards into rows of GRID_COLUMNS. Declared width is a minimum; when a
 * row ends short, its last card absorbs the remainder, capped at
 * STRETCH_MAX_WIDTH so one card never balloons across a near-empty row.
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
			// A full-width card already spans the row; only grow a short one, and
			// never past the cap.
			const grown = Math.min(last.renderedWidth + remainder, STRETCH_MAX_WIDTH);
			if (grown > last.renderedWidth && !(isFinalRow && row.length === 1)) {
				last.renderedWidth = grown;
			}
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
