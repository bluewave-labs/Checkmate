import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { logger } from "@/Utils/logger";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import {
	CardIds,
	DASHBOARD_CARDS_STORAGE_KEY,
	DEFAULT_CARD_IDS,
	type CardId,
} from "./cards";
import { CARD_REGISTRY, getCard } from "./registry";

import type { CardDefinition } from "./cards";

const isCardId = (value: unknown): value is CardId =>
	typeof value === "string" && (CardIds as readonly string[]).includes(value);

/** Stored ids are validated: a card removed from a release must not break the page. */
const readStored = (): CardId[] | null => {
	try {
		const raw = window.localStorage.getItem(DASHBOARD_CARDS_STORAGE_KEY);
		if (!raw) {
			return null;
		}
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return null;
		}
		// An empty array is a real choice — a dashboard the user emptied — and
		// must not fall back to the defaults. Only an absent or malformed key
		// returns null. Unknown ids are dropped so a card removed in a later
		// release cannot break the page.
		return parsed.filter(isCardId);
	} catch (error) {
		logger.error(
			"Could not read dashboard card selection",
			error instanceof Error ? error : undefined
		);
		return null;
	}
};

/**
 * Which cards are on the page, persisted per browser. Admin-only cards are
 * filtered out entirely for non-admins — hidden, not disabled.
 */
export const useCardSelection = () => {
	const isAdmin = useIsAdmin();
	const [selected, setSelected] = useState<CardId[]>(
		() => readStored() ?? DEFAULT_CARD_IDS
	);

	// Skip the write on mount. The value has just been read from storage, so
	// rewriting it achieves nothing — but if the read failed for any reason and
	// fell back to the defaults, that write would overwrite the user's real
	// selection and make the loss permanent.
	const hasMounted = useRef(false);

	useEffect(() => {
		if (!hasMounted.current) {
			hasMounted.current = true;
			return;
		}
		try {
			window.localStorage.setItem(DASHBOARD_CARDS_STORAGE_KEY, JSON.stringify(selected));
		} catch (error) {
			logger.error(
				"Could not persist dashboard card selection",
				error instanceof Error ? error : undefined
			);
		}
	}, [selected]);

	const isVisible = useCallback(
		(card: CardDefinition) => !card.adminOnly || isAdmin,
		[isAdmin]
	);

	// Selection order is the render order.
	const cards = useMemo(
		() =>
			selected
				.map(getCard)
				.filter((card): card is CardDefinition => card !== undefined)
				.filter(isVisible),
		[selected, isVisible]
	);

	const available = useMemo(() => CARD_REGISTRY.filter(isVisible), [isVisible]);

	const addCard = useCallback((id: CardId) => {
		setSelected((current) => (current.includes(id) ? current : [...current, id]));
	}, []);

	const removeCard = useCallback((id: CardId) => {
		setSelected((current) => current.filter((cardId) => cardId !== id));
	}, []);

	const resetCards = useCallback(() => setSelected(DEFAULT_CARD_IDS), []);

	/**
	 * Swaps a card with its neighbour. `delta` is -1 for up, +1 for down.
	 *
	 * Positions are resolved against the *visible* order, not the stored array:
	 * a non-admin never sees the admin cards, so moving a card past one of them
	 * would otherwise appear to do nothing.
	 */
	const moveCard = useCallback(
		(id: CardId, delta: -1 | 1) => {
			setSelected((current) => {
				const visible = current.filter((cardId) => {
					const card = getCard(cardId);
					return card !== undefined && isVisible(card);
				});
				const from = visible.indexOf(id);
				const to = from + delta;
				if (from === -1 || to < 0 || to >= visible.length) {
					return current;
				}
				// Swap in the visible order, then write that order back over the
				// stored positions the visible cards occupy, leaving hidden cards
				// exactly where they were.
				const reordered = [...visible];
				[reordered[from], reordered[to]] = [reordered[to], reordered[from]];

				let next = 0;
				return current.map((cardId) =>
					visible.includes(cardId) ? reordered[next++] : cardId
				);
			});
		},
		[isVisible]
	);

	return {
		cards,
		available,
		selected,
		addCard,
		removeCard,
		moveCard,
		resetCards,
	};
};
