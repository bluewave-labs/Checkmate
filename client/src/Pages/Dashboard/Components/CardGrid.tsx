import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { GripVertical } from "lucide-react";
import {
	DndContext,
	closestCenter,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";

import { Icon } from "@/Components/design-elements";
import { LAYOUT } from "@/Utils/Theme/constants";
import { GRID_COLUMNS, type CardDefinition, type CardId } from "../cards";
import { CardSlotContext } from "./CardSlotContext";

const SortableCard = ({ card }: { card: CardDefinition }) => {
	const theme = useTheme();
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: card.id });
	const Component = card.component;

	return (
		<Box
			ref={setNodeRef}
			minWidth={0}
			sx={{
				width: {
					xs: "100%",
					md:
						card.width >= GRID_COLUMNS
							? "100%"
							: `calc(${(card.width / GRID_COLUMNS) * 100}% - ${theme.spacing(LAYOUT.MD / 2)})`,
				},
				transform: transform
					? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
					: undefined,
				transition,
				opacity: isDragging ? 0.4 : 1,
				zIndex: isDragging ? 1 : "auto",
			}}
		>
			<CardSlotContext.Provider
				value={
					<Box
						{...attributes}
						{...listeners}
						display="flex"
						alignItems="center"
						sx={{
							cursor: "grab",
							"&:active": { cursor: "grabbing" },
							touchAction: "none",
						}}
					>
						<Icon
							icon={GripVertical}
							size={16}
							color={theme.palette.text.secondary}
						/>
					</Box>
				}
			>
				<Component />
			</CardSlotContext.Provider>
		</Box>
	);
};

export const CardGrid = ({
	cards,
	onReorder,
}: {
	cards: CardDefinition[];
	onReorder: (sourceIndex: number, destIndex: number) => void;
}) => {
	const theme = useTheme();

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		})
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const sourceIndex = cards.findIndex((c) => c.id === active.id);
		const destIndex = cards.findIndex((c) => c.id === over.id);
		if (sourceIndex !== -1 && destIndex !== -1) onReorder(sourceIndex, destIndex);
	};

	const cardIds = cards.map((c) => c.id);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={cardIds}
				strategy={rectSortingStrategy}
			>
				<Box
					display="flex"
					flexWrap="wrap"
					gap={theme.spacing(LAYOUT.MD)}
					alignItems="stretch"
				>
					{cards.map((card) => (
						<SortableCard
							key={card.id}
							card={card}
						/>
					))}
				</Box>
			</SortableContext>
		</DndContext>
	);
};
