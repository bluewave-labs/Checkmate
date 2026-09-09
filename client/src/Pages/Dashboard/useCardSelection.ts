import { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";

import { useIsAdmin } from "@/Hooks/useIsAdmin";
import { setDashboardCards } from "@/Features/UI/uiSlice";
import { CardIds, DEFAULT_CARD_IDS, type CardId } from "./cards";
import { CARD_REGISTRY, getCard } from "./registry";

import type { CardDefinition } from "./cards";
import type { RootState } from "@/store";

const isCardId = (value: unknown): value is CardId =>
	typeof value === "string" && (CardIds as readonly string[]).includes(value);

export const useCardSelection = () => {
	const dispatch = useDispatch();
	const isAdmin = useIsAdmin();

	// null means the user has never customised; fall back to defaults.
	const stored = useSelector((state: RootState) => state.ui.dashboardCards);
	const selected: CardId[] = useMemo(
		() => (stored !== null ? stored.filter(isCardId) : [...DEFAULT_CARD_IDS]),
		[stored]
	);

	const isVisible = useCallback(
		(card: CardDefinition) => !card.adminOnly || isAdmin,
		[isAdmin]
	);

	const cards = useMemo(
		() =>
			selected
				.map(getCard)
				.filter((card): card is CardDefinition => card !== undefined)
				.filter(isVisible),
		[selected, isVisible]
	);

	const available = useMemo(() => CARD_REGISTRY.filter(isVisible), [isVisible]);

	const addCard = useCallback(
		(id: CardId) => {
			if (!selected.includes(id)) dispatch(setDashboardCards([...selected, id]));
		},
		[dispatch, selected]
	);

	const removeCard = useCallback(
		(id: CardId) => {
			dispatch(setDashboardCards(selected.filter((cardId) => cardId !== id)));
		},
		[dispatch, selected]
	);

	const resetCards = useCallback(() => dispatch(setDashboardCards(null)), [dispatch]);

	const selectAll = useCallback(
		() =>
			dispatch(
				setDashboardCards(
					available.map((card) => card.id).filter((id) => !selected.includes(id)).length >
						0
						? [...new Set([...selected, ...available.map((card) => card.id)])]
						: selected
				)
			),
		[dispatch, available, selected]
	);

	const deselectAll = useCallback(() => dispatch(setDashboardCards([])), [dispatch]);

	/**
	 * Reorders cards based on DnD source/dest indices into the visible `cards` array.
	 * Hidden admin cards keep their stored positions unchanged.
	 */
	const reorderCards = useCallback(
		(sourceIndex: number, destIndex: number) => {
			const visibleIds = cards.map((c) => c.id);
			const reordered = [...visibleIds];
			const [moved] = reordered.splice(sourceIndex, 1);
			reordered.splice(destIndex, 0, moved);
			let visibleIdx = 0;
			dispatch(
				setDashboardCards(
					selected.map((cardId) =>
						visibleIds.includes(cardId) ? reordered[visibleIdx++] : cardId
					)
				)
			);
		},
		[dispatch, cards, selected]
	);

	const allSelected = available.every((card) => selected.includes(card.id));

	return {
		cards,
		available,
		selected,
		addCard,
		removeCard,
		reorderCards,
		resetCards,
		selectAll,
		deselectAll,
		allSelected,
	};
};
