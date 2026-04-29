import { useState, useEffect } from "react";
import { Dialog, TextField } from "@/Components/inputs";
import { usePut } from "@/Hooks/UseApi";
import { useTranslation } from "react-i18next";

interface DialogResolutionProps {
	open: boolean;
	incidentId: string | null;
	onClose: () => void;
	onResolved?: () => void;
}

export const DialogResolution = ({
	open,
	incidentId,
	onClose,
	onResolved,
}: DialogResolutionProps) => {
	const { t } = useTranslation();
	const [comment, setComment] = useState("");
	const { put: resolveIncident, loading: isResolving } = usePut();

	useEffect(() => {
		if (open) {
			setComment("");
		}
	}, [open]);

	const handleCancel = () => {
		onClose();
	};

	const handleConfirm = async () => {
		if (!incidentId) return;
		const body = comment.trim() ? { comment: comment.trim() } : {};
		const result = await resolveIncident(`/incidents/${incidentId}/resolve`, body);
		if (result) {
			onClose();
			onResolved?.();
		}
	};

	return (
		<Dialog
			open={open}
			title={t("pages.incidents.dialog.resolveIncident.title")}
			onCancel={handleCancel}
			onConfirm={handleConfirm}
			confirmColor="error"
			loading={isResolving}
			maxWidth="sm"
			fullWidth
		>
			<TextField
				fieldLabel={t("pages.incidents.dialog.resolveIncident.option.comment.label")}
				placeholder={t(
					"pages.incidents.dialog.resolveIncident.option.comment.placeholder"
				)}
				value={comment}
				onChange={(e) => setComment(e.target.value)}
				fullWidth
			/>
		</Dialog>
	);
};
