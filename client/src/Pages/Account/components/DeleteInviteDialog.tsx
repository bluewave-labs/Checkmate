import { useTranslation } from "react-i18next";
import { Dialog } from "@/Components/inputs";
import { useDelete } from "@/Hooks/UseApi";
import type { Invite } from "@/Types/Invite";

interface DeleteInviteDialogProps {
	invite: Invite | null;
	onClose: () => void;
	onSuccess?: () => void;
}

export const DeleteInviteDialog = ({
	invite,
	onClose,
	onSuccess,
}: DeleteInviteDialogProps) => {
	const { t } = useTranslation();
	const { deleteFn, loading } = useDelete();

	const handleConfirm = async () => {
		if (!invite) return;
		const result = await deleteFn(`/invite/${invite.id}`);
		if (result?.success) {
			onSuccess?.();
			onClose();
		}
	};

	return (
		<Dialog
			open={invite !== null}
			title={t("pages.account.team.invites.delete.title")}
			content={
				invite
					? t("pages.account.team.invites.delete.description", { email: invite.email })
					: undefined
			}
			onCancel={onClose}
			onConfirm={handleConfirm}
			confirmText={t("common.buttons.delete")}
			confirmColor="error"
			loading={loading}
			maxWidth="xs"
			fullWidth
		/>
	);
};
