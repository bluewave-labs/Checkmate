import { useCallback, useLayoutEffect, useRef } from "react";

import type { CardId } from "./cards";

/** Long enough to follow a card across a row, short enough not to feel slow. */
const DURATION_MS = 260;
/** Decelerating: quick to leave, gentle to settle. */
const EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";

/**
 * Animates cards between layout positions using FLIP — First, Last, Invert,
 * Play. The grid re-renders in its new order immediately; each card is then
 * offset back to where it used to be and released, so it appears to travel
 * from the old position to the new one.
 *
 * This animates the real layout rather than faking movement, so cards that
 * shift because *another* card moved animate too, and the effect stays correct
 * however the grid reflows.
 *
 * Honours prefers-reduced-motion by skipping the animation entirely.
 */
export const useCardTransitions = () => {
	const nodes = useRef(new Map<CardId, HTMLElement>());
	const positions = useRef(new Map<CardId, DOMRect>());
	/** Set only for the render that follows a reorder, so nothing animates on data refresh. */
	const isAnimating = useRef(false);
	/** The card the user moved, lifted above the rest while it travels. */
	const movedCard = useRef<CardId | null>(null);

	const registerCard = useCallback((id: CardId, node: HTMLElement | null) => {
		if (node) {
			nodes.current.set(id, node);
		} else {
			nodes.current.delete(id);
		}
	}, []);

	/**
	 * Call immediately before the state change that reorders the cards.
	 * `movedId` is the card the user acted on; it rides above the others so the
	 * swap reads as one card moving rather than two sliding through each other.
	 */
	const capturePositions = useCallback((movedId: CardId) => {
		positions.current.clear();
		for (const [id, node] of nodes.current) {
			positions.current.set(id, node.getBoundingClientRect());
		}
		movedCard.current = movedId;
		isAnimating.current = true;
	}, []);

	useLayoutEffect(() => {
		if (!isAnimating.current) {
			return;
		}
		isAnimating.current = false;

		const reducedMotion = window.matchMedia?.(
			"(prefers-reduced-motion: reduce)"
		)?.matches;
		if (reducedMotion) {
			positions.current.clear();
			movedCard.current = null;
			return;
		}

		for (const [id, node] of nodes.current) {
			const previous = positions.current.get(id);
			if (!previous) {
				continue;
			}
			const current = node.getBoundingClientRect();
			const deltaX = previous.left - current.left;
			const deltaY = previous.top - current.top;
			if (deltaX === 0 && deltaY === 0) {
				continue;
			}

			// Invert: jump back to the old position with no transition...
			node.style.transition = "none";
			node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
			if (id === movedCard.current) {
				node.style.zIndex = "1";
			}

			// ...then play: on the next frame, release to the new one.
			requestAnimationFrame(() => {
				node.style.transition = `transform ${DURATION_MS}ms ${EASING}`;
				node.style.transform = "";
				// Clear the inline styles once settled. Left in place they would
				// animate the card again on any later reflow it did not ask for.
				window.setTimeout(() => {
					node.style.transition = "";
					node.style.zIndex = "";
				}, DURATION_MS);
			});
		}
		positions.current.clear();
		movedCard.current = null;
	});

	return { registerCard, capturePositions };
};
