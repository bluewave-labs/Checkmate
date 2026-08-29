import { useCallback, useEffect, useMemo, useState } from "react";

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
		const valid = parsed.filter(isCardId);
		return valid.length > 0 ? valid : null;
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

	useEffect(() => {
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

	return { cards, available, selected, addCard, removeCard, resetCards };
};
