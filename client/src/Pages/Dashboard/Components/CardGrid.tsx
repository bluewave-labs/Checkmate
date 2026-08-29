import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";

import { LAYOUT } from "@/Utils/Theme/constants";
import { GRID_COLUMNS, type CardDefinition, type CardId } from "../cards";
import { layoutCards } from "../layout";
import { CardReorderControls } from "./CardReorderControls";
import { CardSlotContext } from "./CardSlotContext";

export const CardGrid = ({
	cards,
	onMove,
}: {
	cards: CardDefinition[];
	onMove: (id: CardId, delta: -1 | 1) => void;
}) => {
	const theme = useTheme();
	const placed = useMemo(() => layoutCards(cards), [cards]);

	return (
		<Box
			display="grid"
			gap={theme.spacing(LAYOUT.MD)}
			sx={{
				gridTemplateColumns: {
					xs: "1fr",
					md: `repeat(${GRID_COLUMNS}, 1fr)`,
				},
				alignItems: "stretch",
			}}
		>
			{placed.map(({ card, renderedWidth }, index) => {
				const Component = card.component;
				return (
					<Box
						key={card.id}
						minWidth={0}
						gridColumn={{ xs: "auto", md: `span ${renderedWidth}` }}
					>
						{/*
						 * The controls go through context rather than a prop so the 17
						 * card components stay unaware of their own position.
						 */}
						<CardSlotContext.Provider
							value={
								<CardReorderControls
									canMoveUp={index > 0}
									canMoveDown={index < placed.length - 1}
									onMoveUp={() => onMove(card.id, -1)}
									onMoveDown={() => onMove(card.id, 1)}
								/>
							}
						>
							<Component />
						</CardSlotContext.Provider>
					</Box>
				);
			})}
		</Box>
	);
};
