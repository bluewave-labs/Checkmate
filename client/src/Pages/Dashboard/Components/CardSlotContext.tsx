import { createContext, useContext } from "react";

import type { ReactNode } from "react";

/**
 * Lets the grid inject per-card header controls without every card component
 * having to accept and forward a prop it does not care about. The grid provides
 * the node; DashboardCard renders it in the header.
 */
export const CardSlotContext = createContext<ReactNode>(null);

export const useCardSlot = (): ReactNode => useContext(CardSlotContext);
