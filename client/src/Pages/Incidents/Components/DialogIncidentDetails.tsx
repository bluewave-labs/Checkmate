import { Dialog } from "@/Components/v2/inputs";
import { useTranslation } from "react-i18next";
import type { Incident } from "@/Types/Incident";

interface DialogIncidentDetailsProps {
	open: boolean;
	incident: Incident | null;
	onClose: () => void;
	onResolve: () => void;
}

export const DialogIncidentDetails = ({
	open,
	incident,
	onClose,
	onResolve,
}: DialogIncidentDetailsProps) => {
	const { t } = useTranslation();

	if (!incident) {
		return null;
	}

	return (
		<Dialog
			open={open}
			title={t("pages.incidents.dialog.details.title")}
			onCancel={onClose}
			onConfirm={onResolve}
			cancelText={t("common.buttons.cancel")}
			confirmText={t("pages.incidents.dialog.details.resolve")}
			maxWidth="md"
			fullWidth
		>
			<pre>{JSON.stringify(incident, null, 2)}</pre>
		</Dialog>
	);
};
