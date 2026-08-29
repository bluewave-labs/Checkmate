import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";

import { LAYOUT } from "@/Utils/Theme/constants";
import { GRID_COLUMNS, type CardDefinition } from "../cards";
import { layoutCards } from "../layout";

export const CardGrid = ({ cards }: { cards: CardDefinition[] }) => {
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
			{placed.map(({ card, renderedWidth }) => {
				const Component = card.component;
				return (
					<Box
						key={card.id}
						minWidth={0}
						gridColumn={{ xs: "auto", md: `span ${renderedWidth}` }}
					>
						<Component />
					</Box>
				);
			})}
		</Box>
	);
};
