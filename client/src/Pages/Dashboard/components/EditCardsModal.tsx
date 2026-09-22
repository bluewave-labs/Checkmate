import { useState } from "react";
import Stack from "@mui/material/Stack";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useTranslation } from "react-i18next";
import { Checkbox, Dialog } from "@/Components/inputs";
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
	const { t } = useTranslation();
	const [draft, setDraft] = useState<Set<DashboardCardKey>>(new Set(visibleCards));

	const handleClose = () => {
		setDraft(new Set(visibleCards));
		onClose();
	};

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
			onCancel={handleClose}
			onConfirm={() => onSave(draft)}
			confirmText={t("pages.dashboard.editCardsModal.done")}
			maxWidth="xs"
			fullWidth
		>
			<Stack>
				{dashboardCardKeys.map((key: DashboardCardKey) => (
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
