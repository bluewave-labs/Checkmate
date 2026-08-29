import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import { Dialog, Checkbox } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { CardGroups, type CardDefinition, type CardGroup, type CardId } from "../cards";

interface CardPickerProps {
	open: boolean;
	available: CardDefinition[];
	selected: CardId[];
	onAdd: (id: CardId) => void;
	onRemove: (id: CardId) => void;
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
	onAdd,
	onRemove,
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

	return (
		<Dialog
			open={open}
			maxWidth="sm"
			fullWidth
			title={t("pages.dashboard.picker.title")}
			// The dialog lays its actions out as cancel → additional → confirm, all
			// right-aligned. Reset takes the cancel slot with an auto right margin
			// so it sits alone on the left, away from Done — a destructive action
			// should not be adjacent to the one people reach for by reflex.
			onCancel={onReset}
			cancelText={t("pages.dashboard.picker.reset")}
			cancelSx={{ marginRight: "auto" }}
			// Changes apply immediately, so Done only dismisses; it is the primary
			// action here and carries the usual contained styling.
			onConfirm={onClose}
			confirmText={t("pages.dashboard.picker.done")}
		>
			<Stack
				gap={theme.spacing(LAYOUT.MD)}
				pt={theme.spacing(LAYOUT.SM)}
			>
				{grouped.map(({ group, cards }) => (
					<Stack
						key={group}
						gap={theme.spacing(LAYOUT.XXS)}
					>
						<Typography
							variant="eyebrow"
							fontSize={typographyLevels.m}
							color={theme.palette.text.disabled}
						>
							{/*
							 * The picker has its own group labels rather than reusing the
							 * sidebar's: the Logs page hosts logs, queue and diagnostics
							 * tabs, so "Logs" would misdescribe the three cards under it.
							 */}
							{t(`pages.dashboard.picker.groups.${group}`, {
								defaultValue: group,
							})}
						</Typography>
						{cards.map((card) => (
							<FormControlLabel
								key={card.id}
								label={
									<Typography
										fontSize={typographyLevels.m}
										color={theme.palette.text.primary}
									>
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
			</Stack>
		</Dialog>
	);
};
