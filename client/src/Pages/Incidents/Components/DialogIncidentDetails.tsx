import { Dialog } from "@/Components/v2/inputs";
import { CardDetails } from "@/Pages/Incidents/Components/CardDetails";

import { useTranslation } from "react-i18next";
import type { Incident } from "@/Types/Incident";
import type { Monitor } from "@/Types/Monitor";

interface DialogIncidentDetailsProps {
	open: boolean;
	incident: Incident | null;
	monitor: Monitor | null;
	onClose: () => void;
	onResolve: () => void;
}

export const DialogIncidentDetails = ({
	open,
	incident,
	monitor,
	onClose,
	onResolve,
}: DialogIncidentDetailsProps) => {
	const { t } = useTranslation();

	const isActive = incident?.status === true;

	return (
		<Dialog
			open={open}
			onCancel={onClose}
			onConfirm={isActive ? onResolve : undefined}
			cancelText={t("common.buttons.close")}
			confirmText={isActive ? t("pages.incidents.dialog.details.resolve") : undefined}
			maxWidth="sm"
			fullWidth
		>
			<CardDetails
				incident={incident}
				monitor={monitor}
			/>
		</Dialog>
	);
};
