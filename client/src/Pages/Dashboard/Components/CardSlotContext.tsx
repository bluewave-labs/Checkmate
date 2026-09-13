import { createContext, useContext } from "react";

import type { ReactNode } from "react";

export const CardSlotContext = createContext<ReactNode>(null);

export const useCardSlot = (): ReactNode => useContext(CardSlotContext);
