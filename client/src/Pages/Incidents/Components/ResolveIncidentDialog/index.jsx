import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Button, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTheme } from "@emotion/react";
import { GenericDialog } from "@/Components/v1/Dialog/genericDialog.jsx";
import TextInput from "@/Components/v1/Inputs/TextInput/index.jsx";

const ResolveIncidentDialog = ({
	open,
	incidentId,
	onClose,
	onResolve,
	onAfterResolve,
	onResolved,
	isLoading = false,
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const [comment, setComment] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (open) {
			setComment("");
		}
	}, [open]);

	const handleConfirm = async () => {
		if (!incidentId) return;
		const trimmed = comment.trim();
		try {
			setIsSubmitting(true);
			await onResolve(incidentId, trimmed ? { comment: trimmed } : {});
			if (onAfterResolve) {
				await onAfterResolve();
			}
			onResolved?.();
			onClose();
		} catch (error) {
			console.error("Error resolving incident:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<GenericDialog
			open={open}
			theme={theme}
			title={t("incidentsPage.resolveIncidentDialogTitle")}
			description={t("incidentsPage.resolveIncidentDialogDescription")}
			onClose={onClose}
		>
			<Stack gap={theme.spacing(4)}>
				<TextInput
					label={t("incidentsPage.resolveIncidentDialogCommentLabel")}
					placeholder={t("incidentsPage.resolveIncidentDialogCommentPlaceholder")}
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					maxWidth="100%"
				/>
				<Stack
					direction="row"
					gap={theme.spacing(4)}
					mt={theme.spacing(4)}
					justifyContent="flex-end"
				>
					<Button
						variant="contained"
						color="secondary"
						onClick={onClose}
						disabled={isLoading || isSubmitting}
					>
						{t("cancel", "Cancel")}
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={handleConfirm}
						disabled={isLoading || isSubmitting}
					>
						{t("incidentsPage.resolveIncidentDialogConfirm")}
					</Button>
				</Stack>
			</Stack>
		</GenericDialog>
	);
};

ResolveIncidentDialog.propTypes = {
	open: PropTypes.bool.isRequired,
	incidentId: PropTypes.string,
	onClose: PropTypes.func.isRequired,
	onResolve: PropTypes.func.isRequired,
	onAfterResolve: PropTypes.func,
	isLoading: PropTypes.bool,
	onResolved: PropTypes.func,
};

export default ResolveIncidentDialog;
