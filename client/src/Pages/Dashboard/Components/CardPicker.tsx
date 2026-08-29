import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import { Dialog, Checkbox, Button } from "@/Components/inputs";
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
			// Every change applies immediately, so there is nothing to confirm and
			// no `onConfirm` — which also keeps the prominent contained button out
			// of the dialog entirely. Reset is destructive and stays quiet beside
			// the close action rather than being the loudest thing on screen.
			onCancel={onClose}
			cancelText={t("pages.dashboard.picker.done")}
			additionalButtons={
				<Button
					variant="outlined"
					color="secondary"
					onClick={onReset}
				>
					{t("pages.dashboard.picker.reset")}
				</Button>
			}
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
							fontSize={typographyLevels.s}
							color={theme.palette.text.disabled}
						>
							{t(`components.sidebar.menu.${group}`, { defaultValue: group })}
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
