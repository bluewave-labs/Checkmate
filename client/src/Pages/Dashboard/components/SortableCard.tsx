import Box from "@mui/material/Box";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";

interface SortableCardProps {
	id: string;
	isDragging?: boolean;
	children: (listeners: DraggableSyntheticListeners) => React.ReactNode;
}

export const SortableCard = ({ id, isDragging, children }: SortableCardProps) => {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
		id,
	});

	return (
		<Box
			ref={setNodeRef}
			{...attributes}
			height="100%"
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				opacity: isDragging ? 0 : 1,
			}}
		>
			{children(listeners)}
		</Box>
	);
};
