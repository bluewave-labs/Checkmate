import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import { Dialog, Checkbox, Button } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";
import { CardGroups, type CardDefinition, type CardGroup, type CardId } from "../cards";

interface CardPickerProps {
	open: boolean;
	available: CardDefinition[];
	selected: CardId[];
	allSelected: boolean;
	onAdd: (id: CardId) => void;
	onRemove: (id: CardId) => void;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	onReset: () => void;
	onClose: () => void;
}

/**
 * Cards are grouped by sidebar section, not by load cost: you look for a card
 * where you look for the feature it belongs to. Admin-only cards never reach
 * `available` for a non-admin, so nobody is offered a card they cannot load.
 */
export const CardPicker = ({
	open,
	available,
	selected,
	allSelected,
	onAdd,
	onRemove,
	onSelectAll,
	onDeselectAll,
	onReset,
	onClose,
}: CardPickerProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const grouped = useMemo(() => {
		return CardGroups.map((group: CardGroup) => ({
			group,
			cards: available.filter((card) => card.group === group),
		})).filter((entry) => entry.cards.length > 0);
	}, [available]);

	const chosen = new Set(selected);
	const someSelected = selected.length > 0 && !allSelected;

	return (
		<Dialog
			open={open}
			maxWidth="sm"
			fullWidth
			title={t("pages.dashboard.picker.title")}
			// Reset sits alone on the left, away from Done — a destructive action
			// should not be adjacent to the one people reach for by reflex.
			onCancel={onReset}
			cancelText={t("pages.dashboard.picker.reset")}
			onConfirm={onClose}
			confirmText={t("pages.dashboard.picker.done")}
			additionalButtons={
				<Button
					variant="outlined"
					color="secondary"
					onClick={allSelected ? onDeselectAll : onSelectAll}
					startIcon={
						<Checkbox
							checked={allSelected}
							indeterminate={someSelected}
							size="small"
							sx={{ p: 0 }}
							onChange={() => {}}
						/>
					}
				>
					{t("pages.dashboard.picker.selectAll")}
				</Button>
			}
		>
			{/*
			 * Two columns: seventeen cards in one list makes the dialog scroll,
			 * which hides most of the catalogue. Groups flow down the columns and
			 * are kept whole so a group is never split across the gap.
			 */}
			<Box
				pt={theme.spacing(LAYOUT.SM)}
				sx={{
					columnCount: { xs: 1, sm: 2 },
					columnGap: theme.spacing(LAYOUT.XL),
				}}
			>
				{grouped.map(({ group, cards }) => (
					<Stack
						key={group}
						gap={theme.spacing(LAYOUT.XXS)}
						pb={theme.spacing(LAYOUT.MD)}
						sx={{ breakInside: "avoid" }}
					>
						<Typography
							variant="eyebrow"
							color={theme.palette.text.disabled}
						>
							{t(`pages.dashboard.picker.groups.${group}`, {
								defaultValue: group,
							})}
						</Typography>
						{cards.map((card) => (
							<FormControlLabel
								key={card.id}
								label={
									<Typography color={theme.palette.text.primary}>
										{t(`pages.dashboard.cards.${card.key}.title`)}
									</Typography>
								}
								control={
									<Checkbox
										checked={chosen.has(card.id)}
										onChange={() =>
											chosen.has(card.id) ? onRemove(card.id) : onAdd(card.id)
										}
									/>
								}
							/>
						))}
					</Stack>
				))}
			</Box>
		</Dialog>
	);
};
