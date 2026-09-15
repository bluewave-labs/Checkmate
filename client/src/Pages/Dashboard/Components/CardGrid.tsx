import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";

import { LAYOUT } from "@/Utils/Theme/constants";
import { GRID_COLUMNS, type CardDefinition, type CardId } from "../cards";
import { layoutCards } from "../layout";
import { useCardTransitions } from "../useCardTransitions";
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
	const { registerCard, capturePositions } = useCardTransitions();

	// Positions are measured before the state change so the cards can be
	// animated from where they were to where they land.
	const handleMove = (id: CardId, delta: -1 | 1) => {
		capturePositions(id);
		onMove(id, delta);
	};

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
						ref={(node: HTMLElement | null) => registerCard(card.id, node)}
						minWidth={0}
						// Positioned so the moving card can be lifted above its
						// neighbours with a z-index while it travels.
						position="relative"
						gridColumn={{ xs: "auto", md: `span ${renderedWidth}` }}
						// Hints the compositor before a transform is applied, so the
						// first frame of a move does not stutter.
						sx={{ willChange: "transform" }}
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
									onMoveUp={() => handleMove(card.id, -1)}
									onMoveDown={() => handleMove(card.id, 1)}
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
