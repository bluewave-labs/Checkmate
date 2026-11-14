import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { useTheme } from "@mui/material/styles";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import type { DashboardCardKey } from "@/Types/Dashboard";
import { RADIUS } from "@/Utils/Theme/constants";

interface SortableCardProps {
	cardKey: DashboardCardKey;
	arranging: boolean;
	children: React.ReactNode;
}

export const SortableCard = ({ cardKey, arranging, children }: SortableCardProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({
			id: cardKey,
			disabled: !arranging,
		});

	return (
		<Grid
			ref={setNodeRef}
			size={{ xs: 12, md: 6 }}
			position="relative"
			zIndex={isDragging ? 1 : "auto"}
			style={{ transform: CSS.Translate.toString(transform), transition }}
		>
			{children}
			{arranging && (
				<Box
					{...attributes}
					{...listeners}
					aria-label={t("pages.dashboard.arrange.handle", {
						card: t(`pages.dashboard.cards.${cardKey}`),
					})}
					position="absolute"
					top={0}
					left={0}
					right={0}
					bottom={0}
					border={2}
					borderColor={isDragging ? theme.palette.primary.main : theme.palette.divider}
					borderRadius={RADIUS.SM}
					bgcolor={
						isDragging ? theme.palette.action.selected : theme.palette.action.hover
					}
					sx={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
				/>
			)}
		</Grid>
	);
};
