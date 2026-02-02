import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { Dialog, TextField } from "@/Components/v2/inputs";
import { usePut } from "@/Hooks/UseApi";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";

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
	const theme = useTheme();
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
			title={t("incidentsPage.resolveIncidentDialogTitle")}
			onCancel={handleCancel}
			onConfirm={handleConfirm}
			confirmText={t("incidentsPage.resolveIncidentDialogConfirm")}
			confirmColor="error"
			cancelColor="primary"
			loading={isResolving}
			maxWidth="sm"
			fullWidth
		>
			<Box sx={{ mt: theme.spacing(4) }}>
				<TextField
					fieldLabel={t("incidentsPage.resolveIncidentDialogCommentLabel")}
					placeholder={t("incidentsPage.resolveIncidentDialogCommentPlaceholder")}
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					fullWidth
				/>
			</Box>
		</Dialog>
	);
};
