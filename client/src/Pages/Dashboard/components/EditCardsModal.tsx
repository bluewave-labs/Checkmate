import { useMemo, useState } from "react";
import Stack from "@mui/material/Stack";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { Checkbox, Dialog } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";
import { type DashboardCardKey, dashboardCardKeys } from "@/Types/Dashboard";

interface EditCardsModalProps {
	open: boolean;
	visibleCards: Set<DashboardCardKey>;
	onClose: () => void;
	onSave: (visibleCards: Set<DashboardCardKey>) => void;
}

export const EditCardsModal = ({
	open,
	visibleCards,
	onClose,
	onSave,
}: EditCardsModalProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [cardsSelection, setCardsSelection] = useState<Set<DashboardCardKey>>(
		new Set(visibleCards)
	);

	const handleClose = () => {
		setCardsSelection(new Set(visibleCards));
		onClose();
	};

	const handleToggle = (key: DashboardCardKey) => {
		setCardsSelection((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	};

	const sortedCardKeys = useMemo(
		() =>
			[...dashboardCardKeys].sort((a, b) =>
				t(`pages.dashboard.cards.${a}`).localeCompare(t(`pages.dashboard.cards.${b}`))
			),
		[t]
	);

	return (
		<Dialog
			open={open}
			title={t("pages.dashboard.editCardsModal.title")}
			content={t("pages.dashboard.editCardsModal.description")}
			onCancel={handleClose}
			onConfirm={() => onSave(cardsSelection)}
			confirmText={t("pages.dashboard.editCardsModal.done")}
			maxWidth="xs"
			fullWidth
		>
			<Stack gap={theme.spacing(LAYOUT.XXS)}>
				<Typography
					variant="eyebrow"
					color={theme.palette.text.disabled}
				>
					{t("pages.dashboard.editCardsModal.groups.uptime")}
				</Typography>
				{sortedCardKeys.map((key: DashboardCardKey) => (
					<FormControlLabel
						key={key}
						label={t(`pages.dashboard.cards.${key}`)}
						control={
							<Checkbox
								checked={cardsSelection.has(key)}
								disabled={cardsSelection.has(key) && cardsSelection.size === 1}
								onChange={() => handleToggle(key)}
							/>
						}
					/>
				))}
			</Stack>
		</Dialog>
	);
};
