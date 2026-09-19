import { useState, useEffect } from "react";
import Stack from "@mui/material/Stack";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useTranslation } from "react-i18next";
import { Checkbox, Dialog } from "@/Components/inputs";

export type DashboardCardKey = "monitorStatus" | "monitorsByType";

interface EditCardsModalProps {
	open: boolean;
	visibleCards: Set<DashboardCardKey>;
	onClose: () => void;
	onSave: (visibleCards: Set<DashboardCardKey>) => void;
}

const allCards: DashboardCardKey[] = ["monitorStatus", "monitorsByType"];

export const EditCardsModal = ({
	open,
	visibleCards,
	onClose,
	onSave,
}: EditCardsModalProps) => {
	const { t } = useTranslation();
	const [draft, setDraft] = useState<Set<DashboardCardKey>>(new Set(visibleCards));

	useEffect(() => {
		if (open) setDraft(new Set(visibleCards));
	}, [open, visibleCards]);

	const handleToggle = (key: DashboardCardKey) => {
		setDraft((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	};

	return (
		<Dialog
			open={open}
			title={t("pages.dashboard.editCardsModal.title")}
			content={t("pages.dashboard.editCardsModal.description")}
			onCancel={onClose}
			onConfirm={() => onSave(draft)}
			confirmText={t("pages.dashboard.editCardsModal.done")}
			maxWidth="xs"
			fullWidth
		>
			<Stack>
				{allCards.map((key) => (
					<FormControlLabel
						key={key}
						label={t(`pages.dashboard.cards.${key}`)}
						control={
							<Checkbox
								checked={draft.has(key)}
								disabled={draft.has(key) && draft.size === 1}
								onChange={() => handleToggle(key)}
							/>
						}
					/>
				))}
			</Stack>
		</Dialog>
	);
};
